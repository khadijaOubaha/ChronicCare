import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatNumber } from '../../utils/formatters';

// Composant PUR : reçoit data = [{ label, v1, v2? }] ; réutilisé côté patient ET médecin.
export default function EvolutionChart({ data, deux = false, name1 = 'Valeur', name2 = 'Valeur 2', unit = '', height = 320 }) {
  const dots = data.length <= 31 ? { r: 4, fill: '#1aa595', stroke: 'none' } : false;
  const fmt = (v, n) => [`${formatNumber(v)} ${unit}`, n];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="#e3e8ec" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#4b6470' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#4b6470' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip formatter={fmt} />
        {deux && <Legend />}
        <Area type="linear" dataKey="v1" name={name1} stroke="#0e4a5c" strokeWidth={3} fill="#0e4a5c" fillOpacity={0.14} dot={dots} />
        {deux && <Line type="linear" dataKey="v2" name={name2} stroke="#1aa595" strokeWidth={3} dot={dots} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
