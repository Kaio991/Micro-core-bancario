"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 1. Elementos da Interface Principal
const nomeUsuario = document.getElementById('nomeUsuario');
const saldoUsuario = document.getElementById('saldoUsuario');
const btnLogout = document.getElementById('btnLogout');
const btnConfig = document.getElementById('btnConfig');
// Modais e Controles
const modalDeposito = document.getElementById('modalDeposito');
const btnAbrirDeposito = document.getElementById('btnAbrirDeposito');
const btnFecharDeposito = document.getElementById('btnFecharDeposito');
const formDeposito = document.getElementById('formDeposito');
const modalPix = document.getElementById('modalPix');
const btnAbrirPix = document.getElementById('btnAbrirPix');
const btnFecharPix = document.getElementById('btnFecharPix');
const formPix = document.getElementById('formPix');
const modalExtrato = document.getElementById('modalExtrato');
const btnAbrirExtrato = document.getElementById('btnAbrirExtrato');
const btnFecharExtrato = document.getElementById('btnFecharExtrato');
const listaTransacoes = document.getElementById('listaTransacoes');
// 2. Função de Controle de Visibilidade dos Modais
function toggleModal(modal) {
    if (!modal)
        return;
    modal.classList.toggle('opacity-0');
    modal.classList.toggle('pointer-events-none');
    document.body.classList.toggle('modal-active');
}
if (btnAbrirDeposito)
    btnAbrirDeposito.addEventListener('click', () => toggleModal(modalDeposito));
if (btnFecharDeposito)
    btnFecharDeposito.addEventListener('click', () => toggleModal(modalDeposito));
if (btnAbrirPix)
    btnAbrirPix.addEventListener('click', () => toggleModal(modalPix));
if (btnFecharPix)
    btnFecharPix.addEventListener('click', () => toggleModal(modalPix));
if (btnAbrirExtrato)
    btnAbrirExtrato.addEventListener('click', () => {
        toggleModal(modalExtrato);
        carregarExtrato();
    });
if (btnFecharExtrato)
    btnFecharExtrato.addEventListener('click', () => toggleModal(modalExtrato));
// 3. Atualizar Dados na Tela do Dashboard
function atualizarTela() {
    var _a, _b;
    const dadosSalvos = localStorage.getItem('usuarioLogado');
    if (!dadosSalvos) {
        window.location.href = 'login.html';
        return;
    }
    const objetoUsuario = JSON.parse(dadosSalvos);
    const nome = ((_a = objetoUsuario.user) === null || _a === void 0 ? void 0 : _a.name) || objetoUsuario.name || 'Usuário';
    const saldo = ((_b = objetoUsuario.user) === null || _b === void 0 ? void 0 : _b.balance) !== undefined ? objetoUsuario.user.balance : (objetoUsuario.balance || 0);
    if (nomeUsuario)
        nomeUsuario.innerText = nome;
    if (saldoUsuario)
        saldoUsuario.innerText = saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// 4. Fetch: Realizar Depósito
if (formDeposito) {
    formDeposito.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const inputValor = document.getElementById('valorDeposito');
        const dadosSalvos = localStorage.getItem('usuarioLogado');
        if (!inputValor || !dadosSalvos)
            return;
        const amount = inputValor.value;
        const objetoUsuario = JSON.parse(dadosSalvos);
        const token = objetoUsuario.token;
        try {
            const response = yield fetch('https://micro-core-bancario-backend.onrender.com/transfer/deposito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: Number(amount) })
            });
            const data = yield response.json();
            if (response.ok) {
                alert('💰 Depósito efetuado com sucesso!');
                const novoSaldo = data.saldoAtualizado || data.saldo || data.novoSaldo || 0;
                if (objetoUsuario.user)
                    objetoUsuario.user.balance = novoSaldo;
                else
                    objetoUsuario.balance = novoSaldo;
                localStorage.setItem('usuarioLogado', JSON.stringify(objetoUsuario));
                atualizarTela();
                formDeposito.reset();
                if (btnFecharDeposito)
                    btnFecharDeposito.click();
            }
            else {
                alert('Erro no depósito: ' + (data.error || data.message));
            }
        }
        catch (error) {
            alert('Erro ao conectar com o servidor.');
        }
    }));
}
// 5. Fetch: Enviar Pix (Sincronizado perfeitamente com as chaves do seu Controller)
if (formPix) {
    formPix.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const inputDestinatario = document.getElementById('destinatarioPix');
        const inputValorPix = document.getElementById('valorPix');
        const inputSenhaPix = document.getElementById('senhaPix');
        const dadosSalvos = localStorage.getItem('usuarioLogado');
        if (!inputDestinatario || !inputValorPix || !inputSenhaPix || !dadosSalvos)
            return;
        const destinatario = inputDestinatario.value.trim();
        const valor = inputValorPix.value;
        const senha = inputSenhaPix.value.trim();
        if (senha.length !== 4) {
            alert('A senha transacional deve conter exatamente 4 dígitos.');
            return;
        }
        const objetoUsuario = JSON.parse(dadosSalvos);
        const token = objetoUsuario.token;
        try {
            const response = yield fetch('https://micro-core-bancario-backend.onrender.com/transfer/pix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverEmail: destinatario,
                    amount: Number(valor),
                    description: 'Transferência Pix',
                    transactionPin: senha
                })
            });
            const data = yield response.json();
            if (response.ok) {
                alert('💸 Pix enviado com sucesso!');
                const saldoAtual = ((_a = objetoUsuario.user) === null || _a === void 0 ? void 0 : _a.balance) !== undefined ? objetoUsuario.user.balance : (objetoUsuario.balance || 0);
                const novoSaldo = Number(saldoAtual) - Number(valor);
                if (objetoUsuario.user)
                    objetoUsuario.user.balance = novoSaldo;
                else
                    objetoUsuario.balance = novoSaldo;
                localStorage.setItem('usuarioLogado', JSON.stringify(objetoUsuario));
                atualizarTela();
                formPix.reset();
                if (btnFecharPix)
                    btnFecharPix.click();
            }
            else {
                alert('Erro ao realizar Pix: ' + (data.error || 'Erro desconhecido.'));
            }
        }
        catch (error) {
            alert('Erro ao conectar com o servidor.');
        }
    }));
}
// 6. Fetch: Carregar Extrato (Corrigido e Blindado)
function carregarExtrato() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!listaTransacoes)
            return;
        const dadosSalvos = localStorage.getItem('usuarioLogado');
        if (!dadosSalvos)
            return;
        const objetoUsuario = JSON.parse(dadosSalvos);
        const token = objetoUsuario.token;
        const currentUserId = ((_a = objetoUsuario.user) === null || _a === void 0 ? void 0 : _a.id) || objetoUsuario.id;
        listaTransacoes.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Buscando transações...</p>';
        try {
            const response = yield fetch('https://micro-core-bancario-backend.onrender.com/transfer/extrato', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = yield response.json();
            if (response.ok && data.transacoes && data.transacoes.length > 0) {
                listaTransacoes.innerHTML = '';
                data.transacoes.forEach((itemTransacao) => {
                    var _a, _b;
                    const itemElemento = document.createElement('div');
                    itemElemento.className = 'flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700/50 my-2';
                    // Tratamento seguro convertendo os IDs de UUID para string limpa e minúscula
                    const idRemetente = String(itemTransacao.senderId).trim().toLowerCase();
                    const idLogado = String(currentUserId).trim().toLowerCase();
                    const isEnviado = idRemetente === idLogado;
                    const rotulo = isEnviado ? 'Pix Enviado' : 'Pix Recebido';
                    // Fallbacks seguros caso os includes do Sequelize falhem ou venham vazios
                    const nomeSender = ((_a = itemTransacao.Sender) === null || _a === void 0 ? void 0 : _a.name) || 'Usuário Desconhecido';
                    const nomeReceiver = ((_b = itemTransacao.Receiver) === null || _b === void 0 ? void 0 : _b.name) || 'Usuário Desconhecido';
                    const contraparte = isEnviado ? nomeReceiver : nomeSender;
                    const corValor = isEnviado ? 'text-rose-400' : 'text-emerald-400';
                    const sinal = isEnviado ? '-' : '+';
                    const valor = Number(itemTransacao.amount);
                    itemElemento.innerHTML = `
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wide text-white">${rotulo}</p>
                        <p class="text-[10px] text-slate-400">${isEnviado ? 'para' : 'de'} ${contraparte}</p>
                        <p class="text-[10px] text-slate-500">${new Date(itemTransacao.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-black ${corValor}">${sinal} R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                `;
                    listaTransacoes.appendChild(itemElemento);
                });
            }
            else {
                listaTransacoes.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Nenhuma movimentação recente encontrada.</p>';
            }
        }
        catch (error) {
            listaTransacoes.innerHTML = '<p class="text-sm text-rose-400 text-center py-4">Erro ao carregar histórico.</p>';
        }
    });
}
// 7. Fetch: Deletar Conta
if (btnConfig) {
    btnConfig.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const confirmar = confirm('⚠️ Atenção: Você tem certeza absoluta que deseja deletar permanentemente a sua conta bancária?');
        if (!confirmar)
            return;
        const dadosSalvos = localStorage.getItem('usuarioLogado');
        if (!dadosSalvos)
            return;
        const token = JSON.parse(dadosSalvos).token;
        try {
            const response = yield fetch('https://micro-core-bancario-backend.onrender.com/auth/deletar', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                alert('🚨 Conta encerrada com sucesso.');
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            }
            else {
                const data = yield response.json();
                alert('Erro ao deletar conta: ' + (data.error || data.message));
            }
        }
        catch (error) {
            alert('Erro de conexão ao tentar deletar conta.');
        }
    }));
}
// 8. Evento de Logout
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    });
}
// Inicializa a tela ao carregar o arquivo
atualizarTela();
