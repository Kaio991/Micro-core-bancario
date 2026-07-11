var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 2. Evento inicial ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    const dadosSalvos = localStorage.getItem('usuarioLogado');
    if (!dadosSalvos) {
        alert('Acesso negado. Por favor, faça login primeiro!');
        window.location.href = './login.html';
        return;
    }
    atualizarTela();
});
// 3. Função para atualizar os dados na tela com segurança
function atualizarTela() {
    var _a, _b, _c, _d, _e;
    const dadosSalvos = localStorage.getItem('usuarioLogado');
    if (!dadosSalvos)
        return;
    const objetoUsuario = JSON.parse(dadosSalvos);
    const nome = objetoUsuario.name || ((_a = objetoUsuario.user) === null || _a === void 0 ? void 0 : _a.name) || "Usuário";
    const saldo = objetoUsuario.balance !== undefined ? objetoUsuario.balance :
        (objetoUsuario.saldo !== undefined ? objetoUsuario.saldo :
            ((_e = (_c = (_b = objetoUsuario.user) === null || _b === void 0 ? void 0 : _b.balance) !== null && _c !== void 0 ? _c : (_d = objetoUsuario.user) === null || _d === void 0 ? void 0 : _d.saldo) !== null && _e !== void 0 ? _e : 0));
    const elemNome = document.getElementById('nomeUsuario');
    const elemSaldo = document.getElementById('saldoUsuario');
    if (elemNome)
        elemNome.innerText = nome;
    if (elemSaldo)
        elemSaldo.innerText = Number(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
// 4. Botão Sair
const btnSair = document.getElementById('btnSair');
if (btnSair) {
    btnSair.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = './login.html';
    });
}
// 5. Controles do Modal de Depósito
const modalDeposito = document.getElementById('modalDeposito');
const btnAbrirDeposito = document.getElementById('btnAbrirDeposito');
const btnFecharDeposito = document.getElementById('btnFecharDeposito');
const formDeposito = document.getElementById('formDeposito');
if (btnAbrirDeposito && modalDeposito) {
    btnAbrirDeposito.addEventListener('click', () => modalDeposito.classList.remove('hidden'));
}
if (btnFecharDeposito && modalDeposito && formDeposito) {
    btnFecharDeposito.addEventListener('click', () => {
        modalDeposito.classList.add('hidden');
        formDeposito.reset();
    });
}
// 6. Fetch: Realizar Depósito
if (formDeposito) {
    formDeposito.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const inputValor = document.getElementById('valorDeposito');
        const dadosSalvos = localStorage.getItem('usuarioLogado');
        if (!inputValor || !dadosSalvos)
            return;
        const amount = inputValor.value;
        const objetoUsuario = JSON.parse(dadosSalvos);
        const token = objetoUsuario.token;
        try {
            const response = yield fetch('http://localhost:3000/auth/deposito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: Number(amount) })
            });
            const data = (yield response.json());
            if (response.ok) {
                alert('💰 Depósito efetuado com sucesso!');
                const novoSaldo = data.saldoAtualizado || data.saldo || ((_a = data.user) === null || _a === void 0 ? void 0 : _a.balance) || 0;
                if (objetoUsuario.user)
                    objetoUsuario.user.balance = novoSaldo;
                else
                    objetoUsuario.balance = novoSaldo;
                localStorage.setItem('usuarioLogado', JSON.stringify(objetoUsuario));
                atualizarTela();
                if (btnFecharDeposito)
                    btnFecharDeposito.click();
            }
            else {
                alert('Erro no depósito: ' + (data.message || data.error));
            }
        }
        catch (error) {
            alert('Erro ao conectar com o servidor.');
        }
    }));
}
// 7. Controles do Modal de Pix
const modalPix = document.getElementById('modalPix');
const btnAbrirPix = document.getElementById('btnAbrirPix');
const btnFecharPix = document.getElementById('btnFecharPix');
const formPix = document.getElementById('formPix');
if (btnAbrirPix && modalPix) {
    btnAbrirPix.addEventListener('click', () => modalPix.classList.remove('hidden'));
}
if (btnFecharPix && modalPix && formPix) {
    btnFecharPix.addEventListener('click', () => {
        modalPix.classList.add('hidden');
        formPix.reset();
    });
}
// 8. Fetch: Enviar Pix
if (formPix) {
    formPix.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const inputDestinatario = document.getElementById('destinatarioPix');
        const inputValorPix = document.getElementById('valorPix');
        const dadosSalvos = localStorage.getItem('usuarioLogado');
        if (!inputDestinatario || !inputValorPix || !dadosSalvos)
            return;
        const destinatario = inputDestinatario.value;
        const valor = inputValorPix.value;
        const objetoUsuario = JSON.parse(dadosSalvos);
        const token = objetoUsuario.token;
        try {
            const response = yield fetch('http://localhost:3000/auth/pix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    para: destinatario,
                    valor: Number(valor)
                })
            });
            const data = (yield response.json());
            if (response.ok) {
                alert('⚡ Pix enviado com sucesso!');
                const novoSaldo = data.novoSaldo || data.saldo || ((_a = data.user) === null || _a === void 0 ? void 0 : _a.balance) || 0;
                if (objetoUsuario.user)
                    objetoUsuario.user.balance = novoSaldo;
                else
                    objetoUsuario.balance = novoSaldo;
                localStorage.setItem('usuarioLogado', JSON.stringify(objetoUsuario));
                atualizarTela();
                if (btnFecharPix)
                    btnFecharPix.click();
            }
            else {
                alert('Erro ao realizar Pix: ' + (data.message || data.error));
            }
        }
        catch (error) {
            alert('Erro ao conectar com o servidor.');
        }
    }));
}
// 9. Fetch: Deletar Conta
const btnDeletarConta = document.getElementById('btnDeletarConta');
if (btnDeletarConta) {
    btnDeletarConta.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const confirmar = confirm("⚠️ ATENÇÃO: Tem a certeza absoluta que deseja APAGAR a sua conta?");
        if (confirmar) {
            const dadosSalvos = localStorage.getItem('usuarioLogado');
            if (!dadosSalvos)
                return;
            const objetoUsuario = JSON.parse(dadosSalvos);
            const token = objetoUsuario.token;
            try {
                const response = yield fetch(`http://localhost:3000/auth/deletar`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = (yield response.json());
                if (response.ok) {
                    alert('Conta removida com sucesso.');
                    localStorage.removeItem('usuarioLogado');
                    window.location.href = '../index.html';
                }
                else {
                    alert('Erro: ' + (data.message || 'Não autorizado.'));
                }
            }
            catch (error) {
                alert('Erro de conexão com o servidor.');
            }
        }
    }));
}
export {};
