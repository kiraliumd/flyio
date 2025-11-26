import { chromium } from 'playwright'

export type Airline = 'LATAM' | 'GOL' | 'AZUL'

export interface BookingDetails {
    flightNumber: string
    departureDate: string // ISO string
    origin: string
    destination: string
    itinerary_details?: any
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
]

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

export async function scrapeBooking(pnr: string, lastname: string, airline: Airline, origin?: string): Promise<BookingDetails> {
    switch (airline) {
        case 'LATAM':
            return await scrapeLatam(pnr, lastname)
        case 'GOL':
            return await scrapeGol(pnr, lastname, origin)
        case 'AZUL':
            return await scrapeAzul(pnr, lastname)
        default:
            throw new Error(`Airline ${airline} not supported`)
    }
}


// Wait, I need to be careful not to break existing code.
// The user asked to change the signature of scrapeBooking and scrapeGol.
// scrapeLatam and scrapeAzul also need to match if they are called by scrapeBooking.
// But scrapeBooking calls them.
// Let's update scrapeBooking first.

// Actually, I'll update scrapeBooking and scrapeGol. scrapeLatam and scrapeAzul can accept the extra arg or I can just pass it and ignore it if I update their signatures.
// Let's update all signatures to be safe.

// Chunk 1: Update scrapeBooking signature
// Chunk 2: Update scrapeGol signature and logic
// Chunk 3: Update scrapeLatam signature (optional, but good for consistency)
// Chunk 4: Update scrapeAzul signature (optional)

// Let's start with scrapeBooking and scrapeGol.

// ...
// Actually, I will just update scrapeBooking and scrapeGol for now as requested.
// "Altere a assinatura das funções scrapeBooking e scrapeGol para aceitar um novo parâmetro opcional: origin?: string."
// The user didn't explicitly ask to update scrapeLatam/Azul signatures, but scrapeBooking calls them.
// If I change scrapeBooking to take origin, I can pass it to scrapeGol.
// scrapeLatam(pnr, lastname) is fine.

// Let's update scrapeBooking.
// And scrapeGol.

// In scrapeGol:
// "Se origin for fornecido, tente preencher o input de origem (se existir na tela da GOL) ou use-o para validação."
// I need to find where the origin input is.
// "A GOL geralmente pede "Código" + "De onde você parte" OU "Sobrenome"."
// So I should look for an input for origin.

// Let's apply the changes.

async function scrapeLatam(pnr: string, lastname: string): Promise<BookingDetails> {
    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1280, height: 720 }
    })
    const page = await context.newPage()

    try {
        console.log(`Starting scrape for LATAM - PNR: ${pnr}`)

        await page.goto('https://www.latamairlines.com/br/pt/minhas-viagens', { waitUntil: 'domcontentloaded' })

        // 1. Espera Inicial para animação
        await page.waitForTimeout(3000)

        // 2. Lógica de Cookies
        try {
            console.log('Tentando fechar cookies...')
            const cookieBtn = page.getByRole('button', { name: 'Aceite todos os cookies' })
            if (await cookieBtn.isVisible({ timeout: 5000 })) {
                await cookieBtn.click()
            }
        } catch (error) {
            // Ignora erro de cookie
        }

        await page.waitForTimeout(1000)

        // 3. Login
        const pnrInput = page.getByLabel(/Número de compra ou código/i).or(page.locator('#confirmationCode'))
        await pnrInput.waitFor({ state: 'visible', timeout: 10000 });
        await pnrInput.click();
        await pnrInput.pressSequentially(pnr, { delay: 100 });

        const lastnameInput = page.getByLabel(/Sobrenome do passageiro/i)
        await lastnameInput.click()
        await lastnameInput.pressSequentially(lastname, { delay: 100 })

        console.log('Dados preenchidos. Clicando em Procurar...');
        await page.getByRole('button', { name: 'Procurar' }).click()

        await page.waitForTimeout(5000)
        await page.mouse.wheel(0, 1000) // Scroll para garantir que elementos carreguem
        await page.waitForTimeout(2000)

        // --- NOVA ESTRATÉGIA: CLIQUE E INTERCEPTAÇÃO NA NOVA ABA ---

        // 1. Localizar e Clicar no Botão (Estratégia Robusta)
        console.log('Procurando botão de Cartão de Embarque...')
        const boardingPassBtn = page.locator('button, a')
            .filter({ hasText: /Cartão de embarque|Boarding Pass/i })
            .first();

        await boardingPassBtn.waitFor({ state: 'visible', timeout: 15000 });
        console.log('Botão encontrado!');

        // 2. Preparar para a Nova Aba (Popup)
        const popupPromise = context.waitForEvent('page');

        // Clique forçado para garantir
        await boardingPassBtn.click({ force: true });

        // 3. Capturar a Nova Aba
        const newPage = await popupPromise;
        await newPage.waitForLoadState('domcontentloaded');
        console.log('Nova aba aberta. Título:', await newPage.title());

        // 4. Interceptar o JSON na NOVA ABA
        console.log('Aguardando JSON de detalhes na nova aba...');

        // O endpoint pode variar, vamos monitorar padrões comuns
        const response = await newPage.waitForResponse(
            (res) => {
                const url = res.url();
                const method = res.request().method();
                const status = res.status();
                const contentType = res.headers()['content-type'] || '';

                // Debug para ver o que está passando
                if (url.includes('boarding-pass') || url.includes('record') || url.includes('trip')) {
                    console.log(`Detectado: ${method} ${status} ${url} [${contentType}]`);
                }

                return (
                    status === 200 &&
                    method === 'GET' && // Ignora OPTIONS
                    contentType.includes('application/json') && // Garante que é JSON
                    (url.includes('boarding-pass') || url.includes('record') || url.includes('trip'))
                );
            },
            { timeout: 30000 }
        );

        await newPage.waitForTimeout(1000); // Respira 1s para garantir o download do corpo
        const data = await response.json();
        console.log('JSON lido com sucesso. Tamanho:', JSON.stringify(data).length);
        // console.log('JSON Preview:', JSON.stringify(data).substring(0, 200));

        // 5. Processamento dos Dados
        // Ajuste conforme a estrutura real retornada. O usuário sugeriu itineraryParts e passengers.
        const itineraryParts = data.itineraryParts || data.trip?.itineraryParts || [];
        const passengers = data.passengers || data.trip?.passengers || [];
        const boardingPasses = data.boardingPasses || [];

        if (!itineraryParts || itineraryParts.length === 0) {
            // Tenta fallback para estrutura 'record' se for diferente
            throw new Error('Estrutura de itinerário não encontrada no JSON capturado.');
        }

        // Pega os segmentos do primeiro itinerário (geralmente Ida)
        // Se houver volta, estaria em itineraryParts[1]
        // Vamos pegar TODOS os segmentos de TODAS as partes
        const allSegments: any[] = [];
        itineraryParts.forEach((part: any) => {
            if (part.segments) {
                allSegments.push(...part.segments);
            }
        });

        const flightSegments = allSegments.map((seg: any) => ({
            flightNumber: `${seg.airlineCode}${seg.flightNumber}`,
            origin: seg.departure?.airport?.airportCode || '---',
            destination: seg.arrival?.airport?.airportCode || '---',
            date: seg.departure?.dateTime?.isoValue,
            arrivalDate: seg.arrival?.dateTime?.isoValue,
            duration: seg.duration || seg.deltaTime // Tenta ambos
        }));

        // Cruzamento de Passageiros com Assentos
        const passengerList = passengers.map((p: any) => {
            const bp = boardingPasses.find((b: any) => b.passengerId === p.id || b.passengerId === p.passengerId);
            return {
                name: `${p.firstName} ${p.lastName}`.toUpperCase(),
                seat: bp?.seatNumber || "Não marcado",
                group: bp?.boardingGroup || "C"
            };
        });

        // 6. Fechar abas e Retornar
        await newPage.close();

        return {
            flightNumber: flightSegments[0].flightNumber,
            origin: flightSegments[0].origin,
            destination: flightSegments[flightSegments.length - 1].destination,
            departureDate: flightSegments[0].date, // Mapeado para departureDate na interface
            itinerary_details: {
                segments: flightSegments,
                passengers: passengerList,
                source: 'NEW_TAB_API'
            }
        };

    } catch (error) {
        console.error(`Scraping failed for LATAM ${pnr}:`, error)
        // Screenshot da página original
        await page.screenshot({ path: 'debug-fail-main.png', fullPage: true });

        // Tenta screenshot da nova aba se ela existir no contexto (difícil acessar aqui se newPage não foi definida no escopo superior)
        // Mas o erro geralmente ocorre antes ou durante.

        throw new Error(`Failed to fetch booking details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
        await browser.close()
    }
}

// --- SCRAPER GOL (Via Interceptação de JSON) ---
async function scrapeGol(pnr: string, lastname: string, origin?: string): Promise<BookingDetails> {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 200,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    })

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'pt-BR'
    })

    // STEALTH MODE
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage()

    // Prevent crash if promise is not awaited due to error
    let apiPromise = page.waitForResponse(res =>
        res.status() === 200 &&
        (res.url().includes('retrieve') || res.url().includes('Booking')) &&
        res.headers()['content-type']?.includes('application/json'),
        { timeout: 60000 }
    ).catch(() => null);

    try {
        console.log(`Starting scrape for GOL - PNR: ${pnr}`)

        // 1. Navegação Blindada (Restored)
        await page.goto('https://b2c.voegol.com.br/minhas-viagens/encontrar-viagem', {
            waitUntil: 'commit', // Não espera assets pesados
            timeout: 60000
        });

        // Espera explícita por QUALQUER input para confirmar carregamento
        try {
            console.log('Aguardando inputs carregarem...');
            await page.waitForSelector('input', { timeout: 45000 });
        } catch (e) {
            console.error('Site GOL não carregou inputs. Tentando screenshot...');
            await page.screenshot({ path: 'debug-gol-load-fail.png' });
            throw new Error('Site da GOL demorou demais para responder.');
        }

        // Interação Humana (Mouse & Teclado)
        await page.mouse.move(100, 100);
        await page.mouse.down();
        await page.mouse.up();
        await page.waitForTimeout(1000);

        console.log('Tentando localizar inputs visualmente...');

        // 2. Preenchimento dos Campos (Restored Robust Selectors)
        // PNR
        const pnrInput = page.getByPlaceholder(/código|reserva/i).or(page.locator('input[type="text"]').nth(0));
        await pnrInput.waitFor({ state: 'visible', timeout: 30000 });
        await pnrInput.click({ force: true });
        await pnrInput.fill(pnr);

        // ORIGEM
        if (origin) {
            console.log(`Preenchendo Origem: ${origin}`);
            const originInput = page.getByPlaceholder(/onde|origem/i).or(page.locator('input[type="text"]').nth(1));

            await originInput.click({ force: true });
            await originInput.clear();
            await page.waitForTimeout(500);

            await originInput.pressSequentially(origin, { delay: 300 });
            console.log('Aguardando dropdown de sugestões...');
            await page.waitForTimeout(2000);

            // Estratégia Híbrida de Seleção
            try {
                const suggestion = page.locator('li, div[role="option"], .m-list-item')
                    .filter({ hasText: origin })
                    .first();

                if (await suggestion.isVisible({ timeout: 3000 })) {
                    console.log('Sugestão encontrada visualmente. Clicando...');
                    await suggestion.click({ force: true });
                } else {
                    throw new Error('Sugestão visual não apareceu');
                }
            } catch (e) {
                console.log('Fallback: Tentando selecionar via Teclado (ArrowDown + Enter)...');
                await originInput.press('ArrowDown');
                await page.waitForTimeout(500);
                await originInput.press('Enter');
                await page.waitForTimeout(500);
                await originInput.press('Tab');
            }
            await page.waitForTimeout(1000);
        }

        // SOBRENOME
        console.log('Preenchendo sobrenome...');
        const lastnameInput = page.getByPlaceholder(/sobrenome/i).or(page.locator('input[type="text"]').nth(origin ? 2 : 1));
        await lastnameInput.click({ force: true });
        await lastnameInput.fill(lastname);

        // 3. ESTRATÉGIA DE SUBMISSÃO PERSISTENTE
        console.log('Preparando para buscar...');

        const submitBtn = page.locator('button[type="submit"], button')
            .filter({ hasText: /encontrar|buscar|continuar|pesquisar/i })
            .first();

        await submitBtn.waitFor({ state: 'visible', timeout: 10000 });

        // Loop de segurança: espera o atributo 'disabled' sumir
        await page.waitForFunction(
            el => el && !el.hasAttribute('disabled') && !el.classList.contains('disabled'),
            await submitBtn.elementHandle()
        ).catch(() => console.log('Aviso: Timeout esperando botão habilitar, tentando clicar mesmo assim...'));

        // TENTATIVA 1: Clique Normal
        console.log('Tentativa 1: Clique...');
        await submitBtn.hover();
        await page.waitForTimeout(500);
        await submitBtn.click({ force: true });

        // TENTATIVA 2: Enter (Se não navegar em 3s)
        try {
            await page.waitForTimeout(3000); // Espera um pouco
            // Verifica se ainda estamos na mesma URL
            if (page.url().includes('encontrar-viagem')) {
                console.log('Tentativa 2: Pressionando ENTER...');
                const inputToFocus = page.getByPlaceholder(/sobrenome/i).or(page.locator('input[type="text"]').nth(origin ? 2 : 1));
                await inputToFocus.focus();
                await page.keyboard.press('Enter');
            }
        } catch (e) { }

        // 4. Captura do JSON
        console.log('Aguardando dados da GOL...');
        const response = await apiPromise;

        if (!response) {
            throw new Error('API da GOL não respondeu ou timeout ocorreu.');
        }

        const json = await response.json();

        // --- PARSE DOS DADOS ---
        const pnrData = json?.response?.pnrRetrieveResponse?.pnr;
        if (!pnrData) throw new Error('JSON inválido ou reserva não encontrada.');

        const trips = pnrData.itinerary.itineraryParts.map((part: any, index: number) => {
            const segments = part.segments.map((seg: any) => ({
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

        const passengerList = pnrData.passengers.map((p: any) => ({
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
        console.error(`GOL Scraper Error:`, error);
        await page.screenshot({ path: 'error-gol-debug.png' });
        throw error;
    } finally {
        await browser.close();
    }
}

async function scrapeAzul(pnr: string, lastname: string): Promise<BookingDetails> {
    console.log('TODO: Implementar scraper da AZUL');
    throw new Error('Integração AZUL em desenvolvimento');
}
