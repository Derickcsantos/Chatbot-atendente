const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Exibe o QR Code no terminal
client.on('qr', qr => qrcode.generate(qr, { small: true }));

client.on('ready', () => {
    console.log('✅ Cliente está pronto!');
});

// Estado do usuário
let userState = {};

const sendMessage = (from, message, delay = 1000) => {
    setTimeout(() => client.sendMessage(from, message), delay);
};

// Menu inicial
const showMainMenu = (from) => {
    userState[from].step = 'menuPrincipal';
    sendMessage(from,
        '🌸 Bem-vindo(a) ao *Salão Paula Tranças*!\nComo posso te ajudar?\n\n' +
        '1️⃣ Agendar horário\n' +
        '2️⃣ Ver catálogo\n' +
        '3️⃣ Dúvidas frequentes\n' +
        '4️⃣ Remarcar ou cancelar\n' +
        '5️⃣ Nossas redes sociais\n' +
        '6️⃣ Trabalhe conosco\n' +
        '7️⃣ Encerrar atendimento'
    );
};

client.on('message', async (message) => {
    const from = message.from;
    const text = message.body.trim().toLowerCase();

    // Inicializa estado do usuário se não existir
    if (!userState[from]) {
        userState[from] = {
            active: false,
            step: 'aguardandoInicio'
        };
    }

    const state = userState[from];

    // Caso o usuário deseje iniciar atendimento
    if (text === 'iniciar atendimento') {
        state.active = true;
        showMainMenu(from);
        return;
    }

    // Caso o usuário deseje encerrar atendimento
    if (text === 'encerrar atendimento') {
        state.active = false;
        state.step = 'aguardandoInicio';
        sendMessage(from, '✅ Atendimento encerrado. Envie *Iniciar atendimento* para falar conosco novamente.');
        return;
    }

    // Se o usuário não tiver iniciado o atendimento, não responde
    if (!state.active) return;

    // Fluxo principal
    switch (state.step) {
        case 'menuPrincipal':
            switch (text) {
                case '1':
                case 'agendar':
                case 'agendar horário':
                    state.step = 'agendar1';
                    sendMessage(from, '👩🏾‍🦱 Já escolheu seu penteado? (sim/não)');
                    break;

                case '2':
                case 'ver catálogo':
                case 'catálogo':
                    state.step = 'catalogo';
                    sendMessage(from, '📒 Veja nosso catálogo aqui:\nhttps://www.whatsapp.com/catalog/5511952801212/?app_absent=0');
                    break;

                case '3':
                case 'dúvidas':
                    state.step = 'duvidas';
                    sendMessage(from, '❓ Envie sua dúvida! Responderemos o quanto antes.');
                    break;

                case '4':
                case 'remarcar':
                case 'cancelar':
                case 'remarcar ou cancelar':
                    state.step = 'remarcarOuCancelar';
                    sendMessage(from, 'Deseja *remarcar* ou *cancelar* seu horário?');
                    break;

                case '5':
                case 'redes sociais':
                    state.step = 'redes';
                    sendMessage(from, '📸 Siga nosso Instagram:\nhttps://www.instagram.com/paulatrancasealongamentos');
                    break;

                case '6':
                case 'trabalhe conosco':
                    state.step = 'trabalhe';
                    sendMessage(from, '💼 Envie fotos do seu trabalho para avaliarmos! Estamos ansiosas para te conhecer!');
                    break;

                case '7':
                case 'encerrar':
                case 'encerrar atendimento':
                    state.active = false;
                    state.step = 'aguardandoInicio';
                    sendMessage(from, '✅ Atendimento encerrado. Envie *Iniciar atendimento* para falar conosco novamente.');
                    break;

                default:
                    sendMessage(from, '❌ Opção inválida. Escolha uma opção do menu digitando o número correspondente.');
                    showMainMenu(from);
            }
            break;

        case 'agendar1':
            if (text === 'sim') {
                state.step = 'agendar2';
                sendMessage(from, '🔤 Qual o nome do penteado que você escolheu?');
            } else if (text === 'não') {
                state.step = 'catalogo';
                sendMessage(from, 'Sem problemas! Veja nosso catálogo:\nhttps://www.whatsapp.com/catalog/5511952801212/?app_absent=0');
            } else {
                sendMessage(from, 'Responda com "sim" ou "não" para continuarmos.');
            }
            break;

        case 'agendar2':
            state.step = 'agendar3';
            sendMessage(from, `Penteado escolhido: *${message.body}*.\n📅 Qual dia e horário deseja agendar?`);
            break;

        case 'agendar3':
            state.step = 'menuPrincipal';
            sendMessage(from, `✅ Agenda registrada para: *${message.body}*.\nEntraremos em contato para confirmar. 🗓️`);
            showMainMenu(from);
            break;

        case 'remarcarOuCancelar':
            if (text === 'remarcar') {
                state.step = 'remarcarData';
                sendMessage(from, '📆 Informe a data atual do agendamento e a nova data desejada.');
            } else if (text === 'cancelar') {
                state.step = 'cancelar';
                sendMessage(from, '❌ Seu agendamento será cancelado. Confirma? (sim/não)');
            } else {
                sendMessage(from, 'Responda com *remarcar* ou *cancelar* para continuarmos.');
            }
            break;

        case 'remarcarData':
            state.step = 'menuPrincipal';
            sendMessage(from, '✅ Solicitação recebida. Entraremos em contato para confirmar a nova data.');
            showMainMenu(from);
            break;

        case 'cancelar':
            if (text === 'sim') {
                state.step = 'menuPrincipal';
                sendMessage(from, '✅ Agendamento cancelado com sucesso. Esperamos te ver em breve!');
                showMainMenu(from);
            } else {
                state.step = 'menuPrincipal';
                sendMessage(from, 'Cancelamento abortado.');
                showMainMenu(from);
            }
            break;

        case 'catalogo':
        case 'duvidas':
        case 'redes':
        case 'trabalhe':
            state.step = 'menuPrincipal';
            showMainMenu(from);
            break;

        default:
            state.step = 'menuPrincipal';
            showMainMenu(from);
            break;
    }
});

client.on('error', err => {
    console.error('❌ Erro:', err);
});

client.initialize();
