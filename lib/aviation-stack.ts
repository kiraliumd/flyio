interface FlightStatus {
    flight_date: string;
    flight_status: string;
    departure: {
        airport: string;
        timezone: string;
        iata: string;
        icao: string;
        terminal: string;
        gate: string;
        delay: number;
        scheduled: string;
        estimated: string;
        actual: string;
        estimated_runway: string;
        actual_runway: string;
    };
    arrival: {
        airport: string;
        timezone: string;
        iata: string;
        icao: string;
        terminal: string;
        gate: string;
        baggage: string;
        delay: number;
        scheduled: string;
        estimated: string;
        actual: string;
        estimated_runway: string;
        actual_runway: string;
    };
    airline: {
        name: string;
        iata: string;
        icao: string;
    };
    flight: {
        number: string;
        iata: string;
        icao: string;
        codeshared: any;
    };
}

export async function getFlightStatus(flightNumber: string): Promise<FlightStatus | null> {
    const apiKey = process.env.AVIATION_STACK_API_KEY;
    if (!apiKey) {
        throw new Error('AVIATION_STACK_API_KEY is not set');
    }

    try {
        const response = await fetch(
            `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}&limit=1`
        );

        if (!response.ok) {
            throw new Error(`AviationStack API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            return data.data[0] as FlightStatus;
        }

        return null;
    } catch (error) {
        console.error('Error fetching flight status:', error);
        return null;
    }
}
