const { chromium } = require('playwright');

// --- Helper Functions ---
// (Mantidas para compatibilidade interna se necessário, mas o proxy será injetado pelo Worker)

async function scrapeLatam(page, pnr, lastname) {
    try {
        console.log(`Starting scrape for LATAM - PNR: ${pnr}`);

        try {
            await page.goto('https://www.latamairlines.com/br/pt/minhas-viagens', { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (e) {
            console.error('Erro de conexão inicial (Proxy?):', e);
            throw new Error('Falha na conexão inicial com o site da LATAM. Verifique o Proxy.');
        }

        await page.waitForTimeout(3000);

        try {
            const cookieBtn = page.getByRole('button', { name: 'Aceite todos os cookies' });
            if (await cookieBtn.isVisible({ timeout: 5000 })) {
                await cookieBtn.click();
            }
        } catch (error) {
            // Ignora erro de cookie
        }

        await page.waitForTimeout(1000);

        const pnrInput = page.getByLabel(/Número de compra ou código/i).or(page.locator('#confirmationCode'));
        await pnrInput.waitFor({ state: 'visible', timeout: 10000 });
        await pnrInput.click();
        await pnrInput.pressSequentially(pnr, { delay: 100 });

        const lastnameInput = page.getByLabel(/Sobrenome do passageiro/i);
        await lastnameInput.click();
        await lastnameInput.pressSequentially(lastname, { delay: 100 });

        console.log('Dados preenchidos. Clicando em Procurar...');
        await page.getByRole('button', { name: 'Procurar' }).click();

        await page.waitForTimeout(5000);
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(2000);

        console.log('Procurando botão de Cartão de Embarque...');
        const boardingPassBtn = page.locator('button, a')
            .filter({ hasText: /Cartão de embarque|Boarding Pass/i })
            .first();

        await boardingPassBtn.waitFor({ state: 'visible', timeout: 15000 });
        console.log('Botão encontrado!');

        // Usar o contexto da página atual para esperar nova aba
        const popupPromise = page.context().waitForEvent('page');
        await boardingPassBtn.click({ force: true });

        const newPage = await popupPromise;
        await newPage.waitForLoadState('domcontentloaded');
        console.log('Nova aba aberta. Título:', await newPage.title());

        console.log('Aguardando JSON de detalhes na nova aba...');
        const response = await newPage.waitForResponse(
            (res) => {
                const url = res.url();
                const method = res.request().method();
                const status = res.status();
                const contentType = res.headers()['content-type'] || '';

                if (url.includes('boarding-pass') || url.includes('record') || url.includes('trip')) {
                    console.log(`Detectado: ${method} ${status} ${url} [${contentType}]`);
                }

                return (
                    status === 200 &&
                    method === 'GET' &&
                    contentType.includes('application/json') &&
                    (url.includes('boarding-pass') || url.includes('record') || url.includes('trip'))
                );
            },
            { timeout: 30000 }
        );

        await newPage.waitForTimeout(1000);
        const data = await response.json();
        console.log('JSON lido com sucesso. Tamanho:', JSON.stringify(data).length);

        const itineraryParts = data.itineraryParts || data.trip?.itineraryParts || [];
        const passengers = data.passengers || data.trip?.passengers || [];
        const boardingPasses = data.boardingPasses || [];

        if (!itineraryParts || itineraryParts.length === 0) {
            throw new Error('Estrutura de itinerário não encontrada no JSON capturado.');
        }

        const allSegments = [];
        itineraryParts.forEach((part) => {
            if (part.segments) {
                allSegments.push(...part.segments);
            }
        });

        const flightSegments = allSegments.map((seg) => ({
            flightNumber: `${seg.airlineCode}${seg.flightNumber}`,
            origin: seg.departure?.airport?.airportCode || '---',
            destination: seg.arrival?.airport?.airportCode || '---',
            date: seg.departure?.dateTime?.isoValue,
            arrivalDate: seg.arrival?.dateTime?.isoValue,
            duration: seg.duration || seg.deltaTime
        }));

        const passengerList = passengers.map((p) => {
            const bp = boardingPasses.find((b) => b.passengerId === p.id || b.passengerId === p.passengerId);
            return {
                name: `${p.firstName} ${p.lastName}`.toUpperCase(),
                seat: bp?.seatNumber || "Não marcado",
                group: bp?.boardingGroup || "C"
            };
        });

        await newPage.close();

        return {
            flightNumber: flightSegments[0].flightNumber,
            origin: flightSegments[0].origin,
            destination: flightSegments[flightSegments.length - 1].destination,
            departureDate: flightSegments[0].date,
            itinerary_details: {
                segments: flightSegments,
                passengers: passengerList,
                source: 'NEW_TAB_API'
            }
        };

    } catch (error) {
        console.error(`Scraping failed for LATAM ${pnr}:`, error);
        await page.screenshot({ path: `debug-fail-latam-${pnr}.png`, fullPage: true });
        throw new Error(`Failed to fetch booking details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function scrapeGol(page, pnr, lastname, origin) {
    // 1. Setup de Listeners (API) antes de navegar
    const apiPromise = page.waitForResponse(res =>
        res.status() === 200 &&
        (res.url().includes('retrieve') || res.url().includes('Booking')) &&
        res.headers()['content-type']?.includes('application/json'),
        { timeout: 30000 }
    ).catch(() => null);

    console.log(`[GOL] Iniciando: ${pnr} (Origin: ${origin || 'N/A'})`);

    try {
        // 2. Navegação Inicial
        await page.goto('https://b2c.voegol.com.br/minhas-viagens/encontrar-viagem', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // 3. Cookies (Melhoria: Locator com timeout curto para não travar)
        try {
            const cookieBtn = page.getByRole('button', { name: /aceitar|concordo|fechar/i }).first();
            if (await cookieBtn.isVisible({ timeout: 5000 })) {
                await cookieBtn.click();
            }
        } catch (e) { }

        // 4. Locators Dinâmicos (Sempre buscar o elemento fresco)
        // SPA re-renderiza o DOM, então não guardamos handle em variáveis fora do escopo de uso imediato.

        const pnrLocator = page.locator('input[name="codigoReserva"], #input-reservation-ticket').first();
        const originLocator = page.locator('input[name="origem"], #input-departure').first();
        const lastNameLocator = page.locator('input[name="sobrenome"], #input-last-name').first();
        const submitBtn = page.locator('button[type="submit"], gds-button').filter({ hasText: /encontrar|continuar/i }).first();

        // 5. Preenchimento (PNR)
        console.log('[GOL] Preenchendo PNR...');
        await pnrLocator.waitFor({ state: 'visible', timeout: 30000 });
        await pnrLocator.fill(pnr);

        // 6. Preenchimento (Origem - Robustez Extrema v2)
        if (origin) {
            console.log(`[GOL] Preenchendo Origem: ${origin}`);
            await originLocator.waitFor({ state: 'visible' });
            await originLocator.click();
            await originLocator.clear();
            await originLocator.pressSequentially(origin, { delay: 300 }); // Digitação MAIS lenta (300ms)

            console.log(`[GOL] Aguardando autocomplete...`);

            // Tenta esperar o autocomplete visual
            let selectedVisual = false;
            try {
                const overlay = page.locator('.cdk-overlay-pane');
                // Aumentando timeout para dar tempo do Angular processar
                await overlay.waitFor({ state: 'visible', timeout: 5000 });

                // Procura opção que contenha o código IATA e clica
                const airportRegex = new RegExp(origin, 'i');
                // Seletor mais amplo e permissivo. Pega o PRIMEIRO item se o filtro falhar.
                const suggestions = overlay.locator('mat-option, gds-list-item, div[role="option"], li');

                let targetSuggestion = suggestions.filter({ hasText: airportRegex }).first();

                if (await targetSuggestion.isVisible({ timeout: 2000 })) {
                    console.log('[GOL] Sugestão exata encontrada. Clicando...');
                    await targetSuggestion.click();
                    selectedVisual = true;
                } else {
                    console.log('[GOL] Sugestão exata não visível. Tentando pegar a primeira opção da lista...');
                    targetSuggestion = suggestions.first();
                    if (await targetSuggestion.isVisible({ timeout: 2000 })) {
                        await targetSuggestion.click();
                        selectedVisual = true;
                        console.log('[GOL] Primeira sugestão clicada (Fallback Visual).');
                    }
                }
            } catch (e) {
                console.log(`[GOL] Autocomplete visual falhou (${e.message}). Iniciando Fallback Teclado...`);
            }

            if (!selectedVisual) {
                // Fallback "Nuclear" Teclado
                // Foca, Seta pra Baixo (2x para garantir), Enter
                await originLocator.focus();
                await page.waitForTimeout(500);
                await page.keyboard.press('ArrowDown');
                await page.waitForTimeout(300);
                // Às vezes o primeiro ArrowDown apenas foca a lista, o segundo seleciona
                // Mas geralmente 1 basta. Vamos tentar ser conservadores.
                await page.keyboard.press('Enter');
                console.log('[GOL] Fallback Teclado executado.');
            }

            // Verificação Final OBRIGATÓRIA
            await page.waitForTimeout(1000); // Mais tempo para propagação
            const finalValue = await originLocator.inputValue();
            if (!finalValue.toUpperCase().includes(origin.toUpperCase())) {
                console.error(`[GOL] Falha crítica na seleção de origem. Valor atual: "${finalValue}", Esperado: "${origin}"`);

                // ULTIMATE ATTEMPT: Se falhou, tenta forçar o valor (pode não funcionar em SPA, mas vale tentar)
                // console.log('[GOL] Tentando forçar valor no input via JS...');
                // await originLocator.evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }, origin);

                throw new Error(`GOL: Falha ao selecionar aeroporto de origem ${origin}.`);
            }
        }

        // 7. Preenchimento (Sobrenome)
        console.log('[GOL] Preenchendo Sobrenome...');
        await lastNameLocator.waitFor({ state: 'visible' });
        await lastNameLocator.fill(lastname);

        // 8. Submit e Loop de Estabilidade
        console.log('[GOL] Submetendo...');
        await submitBtn.focus();
        await submitBtn.click();

        console.log('[GOL] Entrando no loop de estabilidade (40s)...');

        // Setup Listener API
        let latestApiResponse = null;
        const responseListener = async (res) => {
            if (res.status() === 200 &&
                (res.url().includes('retrieve') || res.url().includes('Booking')) &&
                res.headers()['content-type']?.includes('application/json')) {
                try {
                    const clone = await res.json().catch(() => null);
                    if (clone && (clone.response?.pnrRetrieveResponse?.pnr || clone.pnr)) {
                        latestApiResponse = clone;
                    }
                } catch (e) { }
            }
        };
        page.on('response', responseListener);

        const TIMEOUT = 40000;
        const MIN_STABILITY_TIME = 2000; // 2s de estabilidade
        const startTime = Date.now();
        let stabilityStart = null;
        let successDetected = false;

        while (Date.now() - startTime < TIMEOUT) {
            // A. Verificação de Erros Fatais
            if (await page.locator('text=não foi encontrada').isVisible()) throw new Error('GOL: Reserva não encontrada.');
            if (await page.locator('text=Verifique os dados').isVisible()) throw new Error('GOL: Dados inválidos.');

            // B. Verificação do Loading (Especifico do Usuário)
            // #loadMytravel gds-progress-bar > div
            const isLoading = await page.locator('#loadMytravel gds-progress-bar > div').isVisible() ||
                await page.locator('gds-loader, [role="progressbar"]').isVisible();

            // C. Verificação de Sucesso (Resultado Visual)
            const hasResult = await page.locator('text=Código da reserva').isVisible() ||
                (await page.locator('text=' + pnr).count() > 0 && !isLoading);

            if (isLoading) {
                // Se está carregando, reseta estabilidade
                if (stabilityStart) {
                    // console.log('[GOL] Loading voltou. Resetando...');
                    stabilityStart = null;
                }
            } else if (hasResult) {
                // Se tem resultado e NÃO tem loading
                if (!stabilityStart) {
                    stabilityStart = Date.now();
                    // console.log('[GOL] Estabilidade iniciada...');
                } else {
                    const duration = Date.now() - stabilityStart;
                    if (duration >= MIN_STABILITY_TIME) {
                        console.log(`[GOL] Estável por ${duration}ms. Sucesso confirmado.`);
                        successDetected = true;
                        break;
                    }
                }
            } else {
                // Nem loading nem resultado (estado transiente ou form voltou)
                stabilityStart = null;
            }

            await page.waitForTimeout(500);
        }

        page.off('response', responseListener);

        if (!successDetected) {
            throw new Error('GOL: Timeout - Carregamento não estabilizou ou erro não detectado.');
        }

        if (!latestApiResponse) {
            throw new Error('GOL: Visual ok, mas payload da API não foi capturado.');
        }

        const json = latestApiResponse;
        const pnrData = json?.response?.pnrRetrieveResponse?.pnr || json?.pnr;

        if (!pnrData) throw new Error('GOL: Estrutura JSON inválida.');

        // 10. Parser (Mantido igual)
        const trips = pnrData.itinerary.itineraryParts.map((part, index) => {
            const segments = part.segments.map((seg) => ({
                flightNumber: `${seg.flight.airlineCode}${seg.flight.flightNumber}`,
                origin: seg.origin,
                destination: seg.destination,
                date: seg.departure,
                arrivalDate: seg.arrival,
                duration: `${Math.floor(seg.duration / 60)}h ${seg.duration % 60}m`,
                airline: 'GOL'
            }));
            return { type: index === 0 ? 'IDA' : 'VOLTA', segments };
        });

        const passengerList = pnrData.passengers.map((p) => ({
            name: `${p.passengerDetails.firstName} ${p.passengerDetails.lastName}`.toUpperCase(),
            seat: "Não marcado",
            group: "—",
            baggage: { hasPersonalItem: true, hasCarryOn: true, hasChecked: false }
        }));

        const firstLeg = trips[0].segments[0];
        const lastLeg = trips[0].segments[trips[0].segments.length - 1];

        return {
            flightNumber: firstLeg.flightNumber,
            departureDate: firstLeg.date,
            origin: firstLeg.origin,
            destination: lastLeg.destination,
            itinerary_details: { trips, passengers: passengerList }
        };

    } catch (error) {
        console.error(`[GOL] Erro fatal: ${error.message}`);
        // NÃO lançar screenshot aqui para produção.
        // O erro será capturado pelo Worker e logado.
        throw error;
    }
}

async function scrapeAzul(page, pnr, origin) {
    if (!origin) throw new Error('Para buscar na Azul, é obrigatório informar o Aeroporto de Origem (ex: VCP).');

    try {
        console.log(`Starting scrape for AZUL - PNR: ${pnr} / Origin: ${origin}`);

        const apiPromise = page.waitForResponse(async res => {
            if (res.status() !== 200) return false;
            const contentType = res.headers()['content-type'] || '';
            if (!contentType.includes('application/json')) return false;

            const url = res.url();
            if (!url.includes('voeazul.com.br') && !url.includes('azul')) return false;

            try {
                const body = await res.json();
                if (body?.data?.journeys || body?.journeys) {
                    console.log(`[MATCH] JSON de reserva encontrado na URL: ${url}`);
                    return true;
                }
            } catch (e) {
            }
            return false;
        }, { timeout: 60000 });

        const directUrl = `https://www.voeazul.com.br/br/pt/home/minhas-viagens?pnr=${pnr}&origin=${origin}`;

        try {
            await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (e) {
            console.error('Erro de conexão inicial AZUL (Proxy?):', e);
            throw new Error('Falha na conexão inicial com o site da AZUL. Verifique o Proxy.');
        }

        console.log('Aguardando JSON da Azul...');
        const response = await apiPromise;
        const json = await response.json();

        const data = json.data?.journeys ? json.data : (json.journeys ? json : null);

        if (!data || !data.journeys) throw new Error('JSON da Azul inválido ou reserva não encontrada.');

        const trips = data.journeys.map((journey, index) => {
            const segments = journey.segments.map((seg) => {
                const info = seg.identifier;
                const start = new Date(info.std).getTime();
                const end = new Date(info.sta).getTime();
                const diffMins = Math.floor((end - start) / 60000);
                const hours = Math.floor(diffMins / 60);
                const minutes = diffMins % 60;

                return {
                    flightNumber: `${info.carrierCode}${info.flightNumber}`,
                    origin: info.departureStation,
                    destination: info.arrivalStation,
                    date: info.std,
                    arrivalDate: info.sta,
                    duration: `${hours} h ${minutes} min`,
                    airline: 'AZUL'
                };
            });
            return {
                type: index === 0 ? 'IDA' : 'VOLTA',
                segments: segments
            };
        });

        const passengerList = data.passengers.map((p) => {
            let seat = "Não marcado";
            try {
                const firstJourney = data.journeys[0];
                const firstSegment = firstJourney.segments[0];
                const paxSeg = firstSegment.passengerSegment.find((ps) => ps.passengerKey === p.passengerKey);
                if (paxSeg && paxSeg.seat && paxSeg.seat.designator) {
                    seat = paxSeg.seat.designator;
                }
            } catch (e) { }

            return {
                name: `${p.name.first} ${p.name.last}`.toUpperCase(),
                seat: seat,
                group: "—",
                baggage: {
                    hasPersonalItem: true,
                    hasCarryOn: true,
                    hasChecked: p.bagCount > 0
                }
            };
        });

        const firstLeg = trips[0].segments[0];
        const lastTrip = trips[trips.length - 1];
        const lastLeg = lastTrip.segments[lastTrip.segments.length - 1];

        return {
            flightNumber: firstLeg.flightNumber,
            departureDate: firstLeg.date,
            origin: firstLeg.origin,
            destination: lastLeg.destination,
            itinerary_details: {
                trips: trips,
                passengers: passengerList
            }
        };

    } catch (error) {
        console.error(`Azul Scraper Error:`, error);
        await page.screenshot({ path: `error-azul-debug-${pnr}.png` });
        throw new Error('Falha ao processar reserva Azul.');
    }
}

module.exports = { scrapeGol, scrapeLatam, scrapeAzul };
