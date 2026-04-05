// ==================== CONFIGURAÇÕES DE SENHAS ====================
const SENHAS = {
    colaborador: "123",
    gerente: "456",
    almoxarife: "789"
};

let currentUser = null; // { userId, nome, tipo }

// ==================== INICIALIZAÇÃO DO BANCO DE DADOS ====================
function initData() {
    // Estoque inicial
    if (!localStorage.getItem('estoque')) {
        const estoque = [
            { id: 1, nome: 'Papel A4', quantidade: 150, unidade: 'pct' },
            { id: 2, nome: 'Caneta Esferográfica', quantidade: 80, unidade: 'un' },
            { id: 3, nome: 'Tecido Algodão', quantidade: 45, unidade: 'metros' },
            { id: 4, nome: 'Linha Poliéster', quantidade: 120, unidade: 'carretéis' }
        ];
        localStorage.setItem('estoque', JSON.stringify(estoque));
    }
    // Pedidos (vazio)
    if (!localStorage.getItem('pedidos')) {
        localStorage.setItem('pedidos', JSON.stringify([]));
    }
    // Avisos iniciais
    if (!localStorage.getItem('avisos')) {
        const avisos = [
            { id: 1, autorId: 'admin', autorNome: 'Sistema', titulo: 'Bem-vindo!', conteudo: 'Use o sistema com responsabilidade.', data: new Date().toISOString(), fixado: true }
        ];
        localStorage.setItem('avisos', JSON.stringify(avisos));
    }
}
initData();

// Helpers
function getEstoque() { return JSON.parse(localStorage.getItem('estoque')); }
function setEstoque(estoque) { localStorage.setItem('estoque', JSON.stringify(estoque)); }
function getPedidos() { return JSON.parse(localStorage.getItem('pedidos')); }
function setPedidos(pedidos) { localStorage.setItem('pedidos', JSON.stringify(pedidos)); }
function getAvisos() { return JSON.parse(localStorage.getItem('avisos')); }
function setAvisos(avisos) { localStorage.setItem('avisos', JSON.stringify(avisos)); }

// ==================== RENDERIZAÇÃO DINÂMICA ====================
function renderCurrentTab(tabId) {
    if (!currentUser) return;
    const contentDiv = document.getElementById('dynamicContent');
    switch(tabId) {
        case 'dashboard': renderDashboard(contentDiv); break;
        case 'estoque': renderEstoque(contentDiv); break;
        case 'solicitacoes': renderSolicitacoes(contentDiv); break;
        case 'meuspedidos': renderMeusPedidos(contentDiv); break;
        case 'entregas': renderEntregas(contentDiv); break;
        case 'redesocial': renderRedeSocial(contentDiv); break;
        default: renderDashboard(contentDiv);
    }
}

// ========== DASHBOARD (para todos) ==========
function renderDashboard(container) {
    const userType = currentUser.tipo;
    const estoque = getEstoque();
    const pedidos = getPedidos();
    const meusPedidos = pedidos.filter(p => p.solicitanteId === currentUser.userId);
    const pendentes = pedidos.filter(p => p.status === 'pendente');
    const aprovados = pedidos.filter(p => p.status === 'aprovado');
    
    let html = `<div class="card"><h2><i class="fas fa-chart-line"></i> Dashboard</h2><div class="grid-2" style="margin-top:1rem;">`;
    html += `<div class="card"><h3>📦 Itens em Estoque</h3><p style="font-size:2rem;">${estoque.length}</p></div>`;
    html += `<div class="card"><h3>📋 Pedidos Ativos</h3><p style="font-size:2rem;">${pedidos.filter(p => p.status !== 'recusado' && p.status !== 'entregue').length}</p></div>`;
    
    if (userType === 'colaborador') {
        html += `<div class="card"><h3>✅ Meus Pedidos</h3><p style="font-size:2rem;">${meusPedidos.length}</p></div>`;
    }
    if (userType === 'gerente') {
        html += `<div class="card"><h3>⏳ Pendentes Aprovação</h3><p style="font-size:2rem;">${pendentes.length}</p></div>`;
    }
    if (userType === 'almoxarife') {
        html += `<div class="card"><h3>🚚 Pedidos Aprovados (p/ entregar)</h3><p style="font-size:2rem;">${aprovados.length}</p></div>`;
    }
    html += `</div></div><div class="card"><h3>⚡ Ações rápidas</h3><p>Utilize o menu lateral para acessar as funcionalidades.</p></div>`;
    container.innerHTML = html;
}

// ========== ESTOQUE ==========
function renderEstoque(container) {
    const estoque = getEstoque();
    const isAdmin = currentUser.tipo === 'gerente' || currentUser.tipo === 'almoxarife';
    let html = `<div class="card"><h2><i class="fas fa-boxes"></i> Controle de Estoque</h2>`;
    if(isAdmin) {
        html += `<button class="btn-primary" id="btnAddItem" style="margin-bottom:1rem; width:auto; padding:0.5rem 1rem;"><i class="fas fa-plus"></i> Adicionar Item</button>`;
    }
    html += `<div class="table-wrapper"><table><thead><tr><th>Item</th><th>Quantidade</th><th>Unidade</th>${isAdmin ? '<th>Ações</th>' : ''}</tr></thead><tbody>`;
    estoque.forEach(item => {
        html += `<tr>
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>${item.unidade}</td>
            ${isAdmin ? `<td><button class="btn-icon edit-item" data-id="${item.id}"><i class="fas fa-edit"></i></button> <button class="btn-icon delete-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></td>` : ''}
        </tr>`;
    });
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    if(isAdmin) {
        document.getElementById('btnAddItem')?.addEventListener('click', () => showItemModal());
        document.querySelectorAll('.edit-item').forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            showItemModal(id);
        }));
        document.querySelectorAll('.delete-item').forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            if(confirm('Remover item permanentemente?')) {
                let estoqueAtual = getEstoque();
                estoqueAtual = estoqueAtual.filter(i => i.id !== id);
                setEstoque(estoqueAtual);
                renderCurrentTab('estoque');
            }
        }));
    }
}

function showItemModal(itemId = null) {
    const estoque = getEstoque();
    const item = itemId ? estoque.find(i => i.id === itemId) : null;
    const nome = prompt('Nome do item:', item ? item.nome : '');
    if(!nome) return;
    const quantidade = parseInt(prompt('Quantidade:', item ? item.quantidade : 0));
    if(isNaN(quantidade)) return;
    const unidade = prompt('Unidade (ex: un, pct, kg):', item ? item.unidade : 'un');
    if(!unidade) return;
    if(itemId) {
        const index = estoque.findIndex(i => i.id === itemId);
        estoque[index] = { ...estoque[index], nome, quantidade, unidade };
        setEstoque(estoque);
    } else {
        const newId = Date.now();
        estoque.push({ id: newId, nome, quantidade, unidade });
        setEstoque(estoque);
    }
    renderCurrentTab('estoque');
}

// ========== APROVAR PEDIDOS (GERENTE) ==========
function renderSolicitacoes(container) {
    if(currentUser.tipo !== 'gerente') {
        container.innerHTML = '<div class="card"><p>Acesso restrito a gerentes.</p></div>';
        return;
    }
    let pedidos = getPedidos();
    pedidos = pedidos.sort((a,b) => new Date(b.dataSolicitacao) - new Date(a.dataSolicitacao));
    let html = `<div class="card"><h2><i class="fas fa-clipboard-list"></i> Solicitações de Insumos</h2>
    <div class="table-wrapper"><table><thead><tr><th>Solicitante</th><th>Item</th><th>Qtd</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
    pedidos.forEach(ped => {
        let statusBadge = '';
        if(ped.status === 'pendente') statusBadge = '<span class="badge" style="background:#f4a261;">Pendente</span>';
        else if(ped.status === 'aprovado') statusBadge = '<span class="badge" style="background:#2b9348;">Aprovado</span>';
        else if(ped.status === 'recusado') statusBadge = '<span class="badge" style="background:#e53e3e;">Recusado</span>';
        else if(ped.status === 'entregue') statusBadge = '<span class="badge" style="background:#3182ce;">Entregue</span>';
        
        html += `<tr>
            <td>${ped.solicitanteNome}</td>
            <td>${ped.itemNome}</td>
            <td>${ped.quantidade}</td>
            <td>${new Date(ped.dataSolicitacao).toLocaleDateString()}</td>
            <td>${statusBadge}</td>
            <td>`;
        if(ped.status === 'pendente') {
            html += `<button class="btn-success aprovar-ped" data-id="${ped.id}">Aprovar</button> <button class="btn-danger recusar-ped" data-id="${ped.id}">Recusar</button>`;
        } else {
            html += `<button class="btn-icon remover-ped" data-id="${ped.id}"><i class="fas fa-times-circle"></i> Remover</button>`;
        }
        html += `</td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    
    document.querySelectorAll('.aprovar-ped').forEach(btn => btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        let pedidosAtual = getPedidos();
        let pedido = pedidosAtual.find(p => p.id === id);
        if(pedido && pedido.status === 'pendente') {
            let estoqueAtual = getEstoque();
            let itemEstoque = estoqueAtual.find(i => i.id === pedido.itemId);
            if(itemEstoque && itemEstoque.quantidade >= pedido.quantidade) {
                itemEstoque.quantidade -= pedido.quantidade;
                setEstoque(estoqueAtual);
                pedido.status = 'aprovado';
                pedido.dataResposta = new Date().toISOString();
                setPedidos(pedidosAtual);
                alert('Pedido aprovado e estoque atualizado!');
            } else {
                alert('Estoque insuficiente! Não é possível aprovar.');
            }
        }
        renderCurrentTab('solicitacoes');
    }));
    document.querySelectorAll('.recusar-ped').forEach(btn => btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        let pedidosAtual = getPedidos();
        let pedido = pedidosAtual.find(p => p.id === id);
        if(pedido) pedido.status = 'recusado';
        setPedidos(pedidosAtual);
        renderCurrentTab('solicitacoes');
    }));
    document.querySelectorAll('.remover-ped').forEach(btn => btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        if(confirm('Remover esta solicitação permanentemente?')) {
            let pedidosAtual = getPedidos();
            pedidosAtual = pedidosAtual.filter(p => p.id !== id);
            setPedidos(pedidosAtual);
            renderCurrentTab('solicitacoes');
        }
    }));
}

// ========== MEUS PEDIDOS (COLABORADOR) ==========
function renderMeusPedidos(container) {
    if(currentUser.tipo !== 'colaborador') {
        container.innerHTML = '<div class="card"><p>Apenas colaboradores podem acessar esta aba.</p></div>';
        return;
    }
    let pedidos = getPedidos().filter(p => p.solicitanteId === currentUser.userId);
    const estoque = getEstoque();
    let html = `<div class="card"><h2><i class="fas fa-shopping-cart"></i> Solicitar Material</h2>
    <form id="formSolicitar">
        <div class="form-group"><label>Item</label><select id="itemSelect" required>${estoque.map(i => `<option value="${i.id}" data-nome="${i.nome}">${i.nome} (disp: ${i.quantidade})</option>`).join('')}</select></div>
        <div class="form-group"><label>Quantidade</label><input type="number" id="qtdSolicitada" min="1" required></div>
        <button type="submit" class="btn-primary">Enviar Solicitação</button>
    </form></div>
    <div class="card"><h3>Histórico de Pedidos</h3><div class="table-wrapper"><table><thead><tr><th>Item</th><th>Quantidade</th><th>Status</th><th>Data</th></tr></thead><tbody>`;
    pedidos.forEach(p => {
        let statusText = '';
        if(p.status === 'pendente') statusText = '⏳ Pendente';
        else if(p.status === 'aprovado') statusText = '✅ Aprovado (aguardando entrega)';
        else if(p.status === 'recusado') statusText = '❌ Recusado';
        else if(p.status === 'entregue') statusText = '📦 Entregue';
        html += `<tr><td>${p.itemNome}</td><td>${p.quantidade}</td><td>${statusText}</td><td>${new Date(p.dataSolicitacao).toLocaleDateString()}</td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    document.getElementById('formSolicitar')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemId = parseInt(document.getElementById('itemSelect').value);
        const quantidade = parseInt(document.getElementById('qtdSolicitada').value);
        const item = getEstoque().find(i => i.id === itemId);
        if(!item) return alert('Item inválido');
        if(quantidade <= 0) return alert('Quantidade inválida');
        const pedidosAtual = getPedidos();
        const novoPedido = {
            id: Date.now(),
            solicitanteId: currentUser.userId,
            solicitanteNome: currentUser.nome,
            itemId: item.id,
            itemNome: item.nome,
            quantidade: quantidade,
            status: 'pendente',
            dataSolicitacao: new Date().toISOString()
        };
        pedidosAtual.push(novoPedido);
        setPedidos(pedidosAtual);
        alert('Solicitação enviada para aprovação!');
        renderCurrentTab('meuspedidos');
    });
}

// ========== ENTREGAR PEDIDOS (ALMOXARIFE) ==========
function renderEntregas(container) {
    if(currentUser.tipo !== 'almoxarife') {
        container.innerHTML = '<div class="card"><p>Acesso restrito ao almoxarife.</p></div>';
        return;
    }
    let pedidos = getPedidos().filter(p => p.status === 'aprovado');
    if(pedidos.length === 0) {
        container.innerHTML = '<div class="card"><h2><i class="fas fa-truck"></i> Entregar Pedidos</h2><p>Nenhum pedido aguardando entrega no momento.</p></div>';
        return;
    }
    let html = `<div class="card"><h2><i class="fas fa-truck"></i> Pedidos Aprovados - Pendentes de Entrega</h2>
    <div class="table-wrapper"><tr><thead><tr><th>Solicitante</th><th>Item</th><th>Quantidade</th><th>Data Aprovação</th><th>Ação</th></tr></thead><tbody>`;
    pedidos.forEach(ped => {
        html += `<tr>
            <td>${ped.solicitanteNome}</td>
            <td>${ped.itemNome}</td>
            <td>${ped.quantidade}</td>
            <td>${ped.dataResposta ? new Date(ped.dataResposta).toLocaleDateString() : '-'}</td>
            <td><button class="btn-success entregar-pedido" data-id="${ped.id}"><i class="fas fa-check-circle"></i> Marcar como Entregue</button></td>
        </tr>`;
    });
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    document.querySelectorAll('.entregar-pedido').forEach(btn => btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        let pedidosAtual = getPedidos();
        let pedido = pedidosAtual.find(p => p.id === id);
        if(pedido && pedido.status === 'aprovado') {
            pedido.status = 'entregue';
            pedido.dataEntrega = new Date().toISOString();
            setPedidos(pedidosAtual);
            alert(`Pedido de ${pedido.itemNome} para ${pedido.solicitanteNome} foi marcado como ENTREGUE.`);
            renderCurrentTab('entregas');
        }
    }));
}

// ========== REDE SOCIAL ==========
function renderRedeSocial(container) {
    let avisos = getAvisos();
    avisos.sort((a,b) => (b.fixado ? 1 : 0) - (a.fixado ? 1 : 0) || new Date(b.data) - new Date(a.data));
    const isGerente = currentUser.tipo === 'gerente';
    let html = `<div class="card"><h2><i class="fas fa-newspaper"></i> Mural da Empresa</h2>
    <form id="formAviso"><div class="form-group"><input type="text" id="avisoTitulo" placeholder="Título" required></div>
    <div class="form-group"><textarea id="avisoConteudo" rows="2" placeholder="Digite seu aviso/notícia..."></textarea></div>
    <button type="submit" class="btn-primary">Publicar Aviso</button></form></div>
    <div class="card"><h3>Últimas Notícias</h3><div id="avisosList">`;
    if(avisos.length === 0) html += '<p>Nenhum aviso publicado.</p>';
    avisos.forEach(av => {
        html += `<div class="aviso-item" style="border-left:4px solid ${av.fixado ? '#f4a261' : '#2c7da0'}; margin-bottom:1rem; padding:0.8rem; background:var(--bg-page); border-radius:1rem;">
            <div style="display:flex; justify-content:space-between;"><strong>${av.titulo} ${av.fixado ? '📌' : ''}</strong> <small>${new Date(av.data).toLocaleString()} por ${av.autorNome}</small></div>
            <p>${av.conteudo}</p>
            ${isGerente ? `<div><button class="btn-icon fixar-aviso" data-id="${av.id}"><i class="fas fa-thumbtack"></i> Fixar</button> <button class="btn-icon excluir-aviso" data-id="${av.id}"><i class="fas fa-trash"></i> Excluir</button></div>` : ''}
        </div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;
    document.getElementById('formAviso')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const titulo = document.getElementById('avisoTitulo').value;
        const conteudo = document.getElementById('avisoConteudo').value;
        if(!titulo.trim()) return;
        const avisosAtual = getAvisos();
        const novo = {
            id: Date.now(),
            autorId: currentUser.userId,
            autorNome: currentUser.nome,
            titulo,
            conteudo,
            data: new Date().toISOString(),
            fixado: false
        };
        avisosAtual.push(novo);
        setAvisos(avisosAtual);
        renderCurrentTab('redesocial');
    });
    if(isGerente) {
        document.querySelectorAll('.fixar-aviso').forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            let avisosAtual = getAvisos();
            const aviso = avisosAtual.find(a => a.id === id);
            if(aviso) aviso.fixado = !aviso.fixado;
            setAvisos(avisosAtual);
            renderCurrentTab('redesocial');
        }));
        document.querySelectorAll('.excluir-aviso').forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            let avisosAtual = getAvisos();
            avisosAtual = avisosAtual.filter(a => a.id !== id);
            setAvisos(avisosAtual);
            renderCurrentTab('redesocial');
        }));
    }
}

// ==================== LOGIN POR NOME + SENHA POR FUNÇÃO ====================
function login(nome, senha) {
    let tipo = null;
    if (senha === SENHAS.colaborador) tipo = 'colaborador';
    else if (senha === SENHAS.gerente) tipo = 'gerente';
    else if (senha === SENHAS.almoxarife) tipo = 'almoxarife';
    else {
        alert('Senha inválida! Use 123 (colaborador), 456 (gerente) ou 789 (almoxarife).');
        return false;
    }

    if (!nome.trim()) {
        alert('Por favor, digite seu nome.');
        return false;
    }

    // Cria um ID único baseado no nome e tipo (para evitar conflito entre funções)
    const userId = `${nome.trim()}_${tipo}`;
    currentUser = {
        userId: userId,
        nome: nome.trim(),
        tipo: tipo
    };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainPanel').classList.remove('hidden');
    document.getElementById('currentUserName').innerText = currentUser.nome;
    let roleLabel = '';
    if (currentUser.tipo === 'colaborador') roleLabel = 'Colaborador';
    else if (currentUser.tipo === 'gerente') roleLabel = 'Gerente';
    else roleLabel = 'Almoxarife';
    document.getElementById('currentUserRole').innerText = roleLabel;
    buildSidebar();
    return true;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainPanel').classList.add('hidden');
}

function buildSidebar() {
    const nav = document.getElementById('sidebarNav');
    if(!currentUser) return;
    const tipo = currentUser.tipo;
    let itens = [];
    if(tipo === 'colaborador') {
        itens = [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
            { id: 'estoque', icon: 'fas fa-boxes', label: 'Estoque' },
            { id: 'meuspedidos', icon: 'fas fa-clipboard-list', label: 'Meus Pedidos' },
            { id: 'redesocial', icon: 'fas fa-users', label: 'Rede Social' }
        ];
    } else if(tipo === 'gerente') {
        itens = [
            { id: 'dashboard', icon: 'fas fa-chart-pie', label: 'Dashboard' },
            { id: 'estoque', icon: 'fas fa-database', label: 'Gestão Estoque' },
            { id: 'solicitacoes', icon: 'fas fa-check-double', label: 'Aprovar Pedidos' },
            { id: 'redesocial', icon: 'fas fa-bullhorn', label: 'Rede Social' }
        ];
    } else if(tipo === 'almoxarife') {
        itens = [
            { id: 'dashboard', icon: 'fas fa-chart-line', label: 'Dashboard' },
            { id: 'estoque', icon: 'fas fa-warehouse', label: 'Estoque Completo' },
            { id: 'entregas', icon: 'fas fa-truck', label: 'Entregar Pedidos' },
            { id: 'redesocial', icon: 'fas fa-comments', label: 'Rede Social' }
        ];
    }
    nav.innerHTML = '';
    itens.forEach(item => {
        const btn = document.createElement('div');
        btn.className = 'nav-item';
        btn.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            renderCurrentTab(item.id);
        });
        nav.appendChild(btn);
    });
    if(nav.firstChild) nav.firstChild.classList.add('active');
    renderCurrentTab(itens[0].id);
}

// Tema escuro/claro
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if(savedTheme === 'dark') document.body.classList.add('dark');
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
}

function checkAutoLogin() {
    const savedUser = sessionStorage.getItem('currentUser');
    if(savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainPanel').classList.remove('hidden');
        document.getElementById('currentUserName').innerText = currentUser.nome;
        let roleLabel = '';
        if (currentUser.tipo === 'colaborador') roleLabel = 'Colaborador';
        else if (currentUser.tipo === 'gerente') roleLabel = 'Gerente';
        else roleLabel = 'Almoxarife';
        document.getElementById('currentUserRole').innerText = roleLabel;
        buildSidebar();
    }
}

// Eventos
document.getElementById('loginBtn')?.addEventListener('click', () => {
    const nome = document.getElementById('loginName').value;
    const senha = document.getElementById('loginPass').value;
    login(nome, senha);
});
document.getElementById('logoutBtn')?.addEventListener('click', logout);
window.addEventListener('load', () => {
    checkAutoLogin();
    initTheme();
});