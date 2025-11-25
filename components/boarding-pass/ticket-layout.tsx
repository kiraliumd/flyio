import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "react-qr-code";
import { Plane, Luggage, Backpack } from "lucide-react";

interface Trip {
  type: 'IDA' | 'VOLTA';
  segments: any[];
}

interface TicketLayoutProps {
  passengers: {
    name: string;
    seat: string;
    group?: string;
  }[];
  trips: Trip[];
  agency?: {
    name: string;
    logo_url?: string | null;
  };
  options?: {
    hasHandBag: boolean;
    hasCheckedBag: boolean;
  };
}

export function TicketLayout({ passengers, trips, agency, options }: TicketLayoutProps) {
  if (!trips?.length) return null;

  // Helper para limpar número do voo
  const cleanFlight = (num: string) => num?.replace(/^(LA|G3|AD)\1/, '$1') || "---";

  // Detectar Cia Aérea pelo primeiro voo
  const firstFlight = trips[0]?.segments[0]?.flightNumber || "";
  const getAirlineStyle = (flightNum: string) => {
    if (flightNum.startsWith("LA")) return { bg: "bg-blue-900", name: "LATAM Airlines" };
    if (flightNum.startsWith("G3")) return { bg: "bg-orange-500", name: "GOL Linhas Aéreas" };
    if (flightNum.startsWith("AD")) return { bg: "bg-sky-500", name: "Azul Linhas Aéreas" };
    return { bg: "bg-gray-800", name: "Cia Aérea" };
  };

  const airline = getAirlineStyle(firstFlight);

  return (
    <div className="w-[900px] min-h-[400px] bg-white rounded-xl shadow-lg overflow-hidden flex border border-gray-200 print:shadow-none print:border-gray-300 print:break-inside-avoid mb-8">
      {/* LADO ESQUERDO (Principal) */}
      <div className="flex-1 flex flex-col relative">

        {/* HEADER: Logo Agência + Bagagem */}
        <div className="p-6 pb-4 flex justify-between items-center">
          {agency?.logo_url ? (
            <img src={agency.logo_url} alt={agency.name} className="h-8 object-contain" />
          ) : (
            <div className="text-xl font-bold text-gray-400">{agency?.name || "Agência"}</div>
          )}

          <div className="flex gap-4">
            {options?.hasHandBag && (
              <div className="flex items-center gap-1 text-gray-600">
                <Backpack className="h-4 w-4" />
                <span className="text-xs font-bold">{passengers.length}x</span>
              </div>
            )}
            {options?.hasCheckedBag && (
              <div className="flex items-center gap-1 text-gray-600">
                <Luggage className="h-4 w-4" />
                <span className="text-xs font-bold">{passengers.length}x</span>
              </div>
            )}
          </div>
        </div>

        {/* BARRA DA CIA AÉREA */}
        <div className={`${airline.bg} w-full px-6 py-2 flex justify-between items-center text-white`}>
          <span className="font-bold text-lg tracking-wide">{airline.name}</span>
          <span className="text-xs font-medium uppercase tracking-widest opacity-90">Reserva de Grupo</span>
        </div>

        <div className="p-6 pt-4">
          {/* LISTA DE PASSAGEIROS */}
          <div className="mb-6">
            <h3 className="text-[10px] uppercase text-gray-500 font-bold mb-2">Passageiros ({passengers.length})</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {passengers.map((p, idx) => (
                <div key={idx} className="text-sm font-bold text-gray-800 truncate border-b border-gray-100 pb-1">
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          {/* ITINERÁRIO (IDA / VOLTA) */}
          <div className="space-y-6">
            {trips.map((trip, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Cabeçalho da Seção */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${trip.type === 'IDA' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                  {trip.type === 'IDA' ? <Plane className="h-3 w-3" /> : <Plane className="h-3 w-3 rotate-180" />}
                  {trip.type === 'IDA' ? 'Voo de Ida' : 'Voo de Volta'}
                </div>

                {/* Lista de Segmentos */}
                <div className="p-3 bg-white space-y-3">
                  {trip.segments.map((seg: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-blue-700">{cleanFlight(seg.flightNumber)}</span>
                          {idx > 0 && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">CONEXÃO</span>}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {format(new Date(seg.date), "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-gray-800">{seg.origin}</div>
                          <div className="text-sm font-medium text-blue-600">
                            {format(new Date(seg.date), "HH:mm")}
                          </div>
                        </div>
                        <div className="flex-1 px-4 flex justify-center">
                          <Plane className="h-4 w-4 text-gray-300 rotate-90" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">{seg.destination}</div>
                          <div className="text-sm font-medium text-blue-600">
                            {seg.arrivalDate ? format(new Date(seg.arrivalDate), "HH:mm") : "--:--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LADO DIREITO (Stub / Canhoto) */}
      <div className="w-[200px] bg-gray-50 p-4 flex flex-col justify-between border-l border-dashed border-gray-300">
        <div>
          <div className="mb-6">
            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Grupo de Embarque</label>
            <div className="text-3xl font-black text-gray-900">{passengers[0]?.group || "-"}</div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-2">Assentos</label>
            <div className="space-y-1">
              {passengers.slice(0, 6).map((p, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="truncate w-20 text-gray-600">{p.name.split(' ')[0]}</span>
                  <span className="font-bold text-gray-900">{p.seat || "-"}</span>
                </div>
              ))}
              {passengers.length > 6 && (
                <div className="text-[10px] text-blue-600 italic mt-1">
                  + {passengers.length - 6} passageiros
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <QRCode value={`GROUP:${firstFlight}|${passengers.length}PAX`} size={100} />
          <span className="text-[10px] text-gray-400 font-mono">{firstFlight}</span>
        </div>
      </div>
    </div>
  );
}
