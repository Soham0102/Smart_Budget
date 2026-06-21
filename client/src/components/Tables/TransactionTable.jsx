import { formatCurrency, formatDate } from '../../utils/format';

export default function TransactionTable({ transactions, currency = 'INR', onEdit, onDelete, showActions = false }) {
  if (!transactions?.length) {
    return <p className="text-center py-8 opacity-50 text-sm">No transactions found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-2 font-medium opacity-60">Date</th>
            <th className="text-left py-3 px-2 font-medium opacity-60">Type</th>
            <th className="text-left py-3 px-2 font-medium opacity-60">Category</th>
            <th className="text-left py-3 px-2 font-medium opacity-60 hidden sm:table-cell">Description</th>
            <th className="text-right py-3 px-2 font-medium opacity-60">Amount</th>
            {showActions && <th className="text-right py-3 px-2 font-medium opacity-60">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-3 px-2">{formatDate(tx.date)}</td>
              <td className="py-3 px-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {tx.type}
                </span>
              </td>
              <td className="py-3 px-2">{tx.category}</td>
              <td className="py-3 px-2 hidden sm:table-cell opacity-70">{tx.description || tx.notes || '-'}</td>
              <td className={`py-3 px-2 text-right font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </td>
              {showActions && (
                <td className="py-3 px-2 text-right space-x-2">
                  <button onClick={() => onEdit?.(tx)} className="text-indigo-400 hover:underline text-xs">Edit</button>
                  <button onClick={() => onDelete?.(tx._id)} className="text-rose-400 hover:underline text-xs">Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
