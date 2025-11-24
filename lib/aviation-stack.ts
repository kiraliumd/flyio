import { format } from 'date-fns'

interface AviationStackResponse {
    pagination: {
        limit: number
        offset: number
        count: number
        total: number
    }
    data: Array<{
        flight_date: string
        flight_status: string
        departure: {
            airport: string
            timezone: string
            iata: string
            icao: string
            terminal: string
            gate: string
            delay: number
            scheduled: string
            estimated: string
            actual: string
            estimated_runway: string
            actual_runway: string
        }
        arrival: {
            airport: string
            timezone: string
            iata: string
            icao: string
            terminal: string
            gate: string
            baggage: string
            delay: number
            scheduled: string
            estimated: string
            actual: string
            estimated_runway: string
            actual_runway: string
        }
        airline: {
            name: string
            iata: string
            icao: string
        }
        flight: {
            number: string
            iata: string
            icao: string
            codeshared: any
        }
    }>
}

export interface FlightStatusResult {
    status: string
    delay: number
    actual_departure: string | null
    actual_arrival: string | null
}

const STATUS_MAP: { [key: string]: string } = {
    active: 'Em Voo',
    landed: 'Atracado',
    scheduled: 'Programado',
    cancelled: 'Cancelado',
    incident: 'Incidente',
    diverted: 'Desviado',
}

export async function getRealTimeFlightStatus(flightIata: string): Promise<FlightStatusResult> {
    const apiKey = process.env.AVIATIONSTACK_API_KEY

    if (!apiKey) {
        console.warn('⚠️ AVIATIONSTACK_API_KEY is missing. Returning mock data.')
        return {
            status: 'Programado',
            delay: 0,
            actual_departure: null,
            actual_arrival: null
        }
    }

    try {
        // Note: Free plan only supports HTTP
        const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightIata}`

        console.log(`Fetching flight status for ${flightIata}...`)
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`AviationStack API error: ${response.statusText}`)
        }

        const json: AviationStackResponse = await response.json()

        if (!json.data || json.data.length === 0) {
            console.warn(`No flight data found for ${flightIata}`)
            return {
                status: 'Programado', // Default fallback
                delay: 0,
                actual_departure: null,
                actual_arrival: null
            }
        }

        // Get the most recent/relevant flight (usually the first one or filter by date if needed)
        // For simplicity, we take the first one returned by the API which is usually the latest
        const flightData = json.data[0]

        const apiStatus = flightData.flight_status

        // Calculate total delay (departure + arrival delay)
        const departureDelay = flightData.departure.delay || 0
        const arrivalDelay = flightData.arrival.delay || 0
        const totalDelay = departureDelay + arrivalDelay

        // Decision Tree Implementation
        let finalStatus = 'Confirmado' // Default (Priority 4)

        // Priority 1: Critical
        if (apiStatus === 'cancelled' || apiStatus === 'diverted') {
            finalStatus = 'Cancelado'
        }
        // Priority 2: Opportunity (Delay)
        else if (totalDelay > 30) {
            finalStatus = 'Atrasado'
        }
        // Priority 3: Completion
        else if (apiStatus === 'landed') {
            finalStatus = 'Completo'
        } else {
            // Check if arrival time has passed
            const arrivalTime = flightData.arrival.estimated || flightData.arrival.scheduled
            if (arrivalTime && new Date(arrivalTime) < new Date()) {
                finalStatus = 'Completo'
            }
        }

        return {
            status: finalStatus,
            delay: totalDelay,
            actual_departure: flightData.departure.actual || flightData.departure.estimated || flightData.departure.scheduled,
            actual_arrival: flightData.arrival.actual || flightData.arrival.estimated || flightData.arrival.scheduled
        }

    } catch (error) {
        console.error('Failed to fetch flight status:', error)
        // Return fallback data instead of crashing
        return {
            status: 'Programado',
            delay: 0,
            actual_departure: null,
            actual_arrival: null
        }
    }
}
