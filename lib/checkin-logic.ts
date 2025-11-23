import { addHours, isAfter, isBefore, subHours } from 'date-fns';

export interface CheckinWindow {
    isOpen: boolean;
    opensAt: Date;
    closesAt: Date;
    status: 'pending' | 'open' | 'closed';
}

export function calculateCheckinWindow(departureDate: Date): CheckinWindow {
    // Rule: Check-in opens 48 hours before departure and closes 2 hours before.
    const opensAt = subHours(departureDate, 48);
    const closesAt = subHours(departureDate, 2);
    const now = new Date();

    let status: 'pending' | 'open' | 'closed' = 'pending';

    if (isAfter(now, opensAt) && isBefore(now, closesAt)) {
        status = 'open';
    } else if (isAfter(now, closesAt)) {
        status = 'closed';
    }

    return {
        isOpen: status === 'open',
        opensAt,
        closesAt,
        status,
    };
}
