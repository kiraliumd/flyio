import { NextResponse } from 'next/server';
import { validatePNR } from '@/lib/pnr-validator';
import { supabase } from '@/lib/supabase/client'; // Note: Should use server client for DB ops

export async function POST(request: Request) {
    try {
        const { pnr, lastName } = await request.json();

        if (!pnr || !lastName) {
            return NextResponse.json(
                { error: 'PNR and Last Name are required' },
                { status: 400 }
            );
        }

        const result = await validatePNR(pnr, lastName);

        if (!result.isValid) {
            return NextResponse.json(
                { error: result.error || 'Invalid PNR' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            flightNumber: result.flightNumber,
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
