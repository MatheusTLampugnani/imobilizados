export const geradorCSV = (data, centroCustoMap) => {
    if (!data || data.length === 0) return;
    const headers = ["ID", "Imob", "Inv", "Descricao", "CC", "Local"];
    const rows = data.map(i => [
        i.id, i.codigo_imobilizado, i.codigo_inventario, 
        `"${(i.descricao||'').replace(/"/g,'""')}"`, 
        i.centro_custo, i.local
    ].join(';'));
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Relatorio.csv";
    link.click();
};