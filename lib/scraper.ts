import { chromium } from 'playwright'

export type Airline = 'LATAM' | 'GOL' | 'AZUL'

export interface BookingDetails {
    flightNumber: string
    departureDate: string // ISO string
    origin: string
    destination: string
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

export async function scrapeBooking(pnr: string, lastname: string, airline: Airline): Promise<BookingDetails> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1280, height: 720 }
    })
    const page = await context.newPage()

    try {
        console.log(`Starting scrape for ${airline} - PNR: ${pnr}`)

        let bookingDetails: BookingDetails

        if (airline === 'LATAM') {
            await page.goto('https://www.latamairlines.com/br/pt/minhas-viagens', { waitUntil: 'domcontentloaded' })

            // 1. Espera Inicial para animação
            await page.waitForTimeout(3000)

            // 2. Lógica de 3 Camadas para Cookies
            try {
                console.log('Tentando fechar cookies...')
                const cookieBtn = page.getByRole('button', { name: 'Aceite todos os cookies' })
                if (await cookieBtn.isVisible({ timeout: 5000 })) {
                    await cookieBtn.click()
                    console.log('Botão de cookies clicado.')
                }
            } catch (error) {
                console.log('Clique falhou, tentando remover o banner via JS...')
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'))
                    const targetBtn = buttons.find(b => b.innerText.includes('Aceite todos os cookies'))
                    if (targetBtn) {
                        targetBtn.closest('div[role="dialog"]')?.remove() || targetBtn.closest('div')?.remove()
                    }
                })
            }

            await page.waitForTimeout(1000)

            // Agora sim, preencher o formulário com lógica Human-Like
            const pnrInput = page.getByLabel(/Número de compra ou código/i)
            await pnrInput.click()
            await pnrInput.pressSequentially(pnr, { delay: 100 })

            await page.waitForTimeout(500)

            const lastnameInput = page.getByLabel(/Sobrenome do passageiro/i)
            await lastnameInput.click()
            await lastnameInput.pressSequentially(lastname, { delay: 100 })

            await page.waitForTimeout(500)

            await page.getByRole('button', { name: 'Procurar' }).click()

            await page.waitForTimeout(5000)

            // Scroll Obrigatório
            await page.mouse.wheel(0, 1000)
            await page.waitForTimeout(2000)

            // Estratégia de Extração (Busca Inteligente via Regex)
            const pageText = await page.evaluate(() => document.body.innerText)

            const flightNumberMatch = pageText.match(/LA\s?\d{3,4}/i)
            const flightNumber = flightNumberMatch ? flightNumberMatch[0].replace(/\s/g, '').toUpperCase() : 'LA0000'

            const dateMatch = pageText.match(/(\d{2})\/(\d{2})\/(\d{4})/)
            let departureDate = new Date().toISOString()
            if (dateMatch) {
                const [_, day, month, year] = dateMatch
                departureDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString()
            }

            const routeMatch = pageText.match(/([A-Z]{3})\s*(-|→|para)\s*([A-Z]{3})/i)
            const origin = routeMatch ? routeMatch[1].toUpperCase() : 'GRU'
            const destination = routeMatch ? routeMatch[3].toUpperCase() : 'MIA'

            bookingDetails = {
                flightNumber,
                departureDate,
                origin,
                destination
            }

        } else if (airline === 'GOL') {
            // ... GOL implementation (placeholder)
            bookingDetails = {
                flightNumber: 'G30000',
                departureDate: new Date().toISOString(),
                origin: 'CGH',
                destination: 'SDU'
            }
        } else {
            // ... AZUL implementation (placeholder)
            bookingDetails = {
                flightNumber: 'AD0000',
                departureDate: new Date().toISOString(),
                origin: 'VCP',
                destination: 'CNF'
            }
        }

        return bookingDetails

    } catch (error) {
        console.error(`Scraping failed for ${airline} ${pnr}:`, error)
        throw new Error(`Failed to fetch booking details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
        await browser.close()
    }
}
