let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let frete = parseFloat(localStorage.getItem('frete')) || 0;
let enderecoFormatado = '';

function formatarPreco(valor) {
    return `R$${valor.toFixed(2).replace(".", ",")}`;
}

function parsePreco(preco) {
    if (typeof preco === 'string') {
        return parseFloat(preco.replace("R$", "").replace(",", ".")) || 0;
    }
    return parseFloat(preco) || 0;
}

function renderizarResumo() {
    const container = document.getElementById('resumo-pedido');
    if (!container) return;

    let html = '';
    let total = 0;

    carrinho.forEach(prod => {
        const quantidade = prod.quantidade || 1;
        const preco = parsePreco(prod.preco);
        const precoUnitario = preco / quantidade;
        const subtotal = precoUnitario * quantidade;
        total += subtotal;

        // Verifica se é hambúrguer com opcionais
        if (prod.pontoCarne || prod.adicionais || prod.combo || prod.observacoes) {
            html += `
          <div class="textw">
            <p>${quantidade}x ${prod.item || prod.nome} - ${formatarPreco(subtotal)} | Ponto: ${prod.pontoCarne || '-'} | Adicionais: ${prod.adicionais || '-'} | Combo: ${prod.combo || '-'} | Obs: ${prod.observacoes || '-'}</p>
          </div>`;
        } else {
            html += `
          <div class="textw">
            <p>${quantidade}x ${prod.item || prod.nome} - ${formatarPreco(subtotal)}</p>
          </div>`;
        }
    });

    document.getElementById('valor-frete').textContent = formatarPreco(frete);
    document.getElementById('total-com-frete').textContent = formatarPreco(total + frete);
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderizarResumo);

// Cálculo do frete
document.body.addEventListener('click', async (e) => {
    if (e.target.classList.contains('calcular-frete')) {
        const cepInput = document.getElementById('cep');
        const numeroCasaInput = document.getElementById('numero-casa');
        const localizacaoCep = document.getElementById('localizacao-cep');
        const cep = cepInput.value.trim();
        const numeroCasa = numeroCasaInput.value.trim();

        if (!/^\d{8}$/.test(cep)) {
            alert('INSIRA UM CEP VÁLIDO (8 números, sem traços ou pontos).');
            localizacaoCep.textContent = '';
            return;
        }

        if (!numeroCasa) {
            alert('Por favor, insira o número da casa.');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro || !cep.startsWith('40')) {
                alert('Somente entregamos na região de Salvador.');
                return;
            }

            enderecoFormatado = `${data.logradouro}, ${numeroCasa} - ${data.bairro}, ${data.localidade} - ${data.uf}`;
            localizacaoCep.textContent = enderecoFormatado;

            frete = 5.00;
            localStorage.setItem('frete', frete.toString());

            document.getElementById('valor-frete').textContent = formatarPreco(frete);
            renderizarResumo();

        } catch (err) {
            alert('Erro ao consultar o CEP. Tente novamente.');
        }
    }
});

// Confirmar pedido e abrir WhatsApp
document.getElementById('confirmar-pedido')?.addEventListener('click', () => {
    const pagamento = document.getElementById('forma-pagamento').value;
    const endereco = document.getElementById('localizacao-cep').textContent;

    if (!endereco) {
        alert('Calcule o frete antes de confirmar.');
        return;
    }

    let total = 0;
    const texto = carrinho.map(p => {
        const quantidade = p.quantidade || 1;
        const preco = parsePreco(p.preco);
        const precoUnitario = preco / quantidade;
        const subtotal = precoUnitario * quantidade;
        total += subtotal;

        if (p.pontoCarne || p.adicionais || p.combo || p.observacoes) {
            return `${quantidade}x ${p.item || p.nome}  ${formatarPreco(subtotal)} | Ponto: ${p.pontoCarne || '-'} | Adicionais: ${p.adicionais || '-'} | Combo: ${p.combo || '-'} | Obs: ${p.observacoes || '-'}`;
        } else {
            return `${quantidade}x ${p.item || p.nome}  ${formatarPreco(subtotal)}`;
        }
    }).join('\n');

    const msg = `Olá! Gostaria de finalizar meu pedido:\n\n${texto}\n\nFrete: ${formatarPreco(frete)}\nTotal: ${formatarPreco(total + frete)}\nForma de pagamento: ${pagamento}\nEndereço: ${endereco}`;
    const url = `https://wa.me/5571982564207?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
});

// Voltar para o carrinho
document.getElementById('voltar-carrinho')?.addEventListener('click', () => {
    window.location.href = 'indexcart.html';
});
