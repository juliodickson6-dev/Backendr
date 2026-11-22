// Escapa valores antes de os inserir em HTML (emails), evitando injeção de código.
function escapeHtml(valor, vazio = 'N/A') {
    if (valor === null || valor === undefined || valor === '') return vazio;
    let texto;
    if (valor instanceof Date) {
        texto = Number.isNaN(valor.getTime()) ? vazio : valor.toISOString().replace('T', ' ').slice(0, 19);
    } else {
        texto = String(valor);
    }
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
