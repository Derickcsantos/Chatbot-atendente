const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Criando uma instância do cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true
    }
});

// Gerar QR Code para login no WhatsApp Web
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Quando o cliente estiver pronto para uso
client.on('ready', () => {
    console.log('O cliente está pronto!');
});

// Armazenar o estado de cada usuário (para seguir o fluxo)
let userState = {};

const sendMessageWithDelay = (message, from) => {
    setTimeout(() => {
        client.sendMessage(from, message);
    }, 2000); // Atraso de 2 segundos
};

client.on('message', async (message) => {
    const from = message.from;
    const userMessage = message.body.toLowerCase();
    
    // Inicializa o estado do usuário se for a primeira vez
    if (!userState[from]) {
        userState[from] = { step: 'start' };
    }

    // Lógica de fluxo com base no estado do usuário
    switch (userState[from].step) {
        case 'start':
            if (
                userMessage === 'oi' || userMessage === 'oii' || userMessage === 'oiii' ||
                userMessage === 'olá' || userMessage === 'boa noite' || userMessage === 'bom dia' ||
                userMessage === 'boa tarde' || userMessage === 'eai' || userMessage === 'salve'
            ) {
                userState[from].step = 'saudacao'; // Altera o estado para o próximo passo
                sendMessageWithDelay('Olá! Obrigada por entrar em contato, seja bem-vinda ao Salão Paula Tranças. Sobre o que gostaria de falar?\n\nEscolha uma das opções abaixo:\n\n1. Agendar horário\n2. Dúvidas\n3. Remarcar/Cancelar\n4. Redes sociais\n5. Trabalhe conosco', from);
            }
            break;

        case 'saudacao':
            if (userMessage === '1' || userMessage === 'agendar horário') {
                userState[from].step = 'agendar'; // Passa para o próximo passo de agendamento
                sendMessageWithDelay('Já decidiu qual o penteado que deseja? (Responda com "sim" ou "não")', from);
            } else if (userMessage === '2' || userMessage === 'dúvidas') {
                userState[from].step = 'duvidas'; // Passa para o próximo passo de dúvidas
                sendMessageWithDelay('Descreva sua dúvida, assim que possível responderemos. Se for sobre agendamento, por favor, forneça os detalhes.', from);
            } else if (userMessage === '3' || userMessage === 'remarcar' || userMessage === 'cancelar') {
                userState[from].step = 'remarcarCancelar'; // Passa para o próximo passo de remarcar/cancelar
                sendMessageWithDelay('Você deseja remarcar ou cancelar seu agendamento? (Responda com "remarcar" ou "cancelar")', from);
            } else if (userMessage === '4' || userMessage === 'redes sociais') {
                userState[from].step = 'redesSociais'; // Passa para o próximo passo de redes sociais
                sendMessageWithDelay('Confira nosso Instagram: https://www.instagram.com/paulatrancasealongamentos.\n\nSe precisar de mais informações, é só nos chamar!', from);
            } else if (userMessage === '5' || userMessage === 'trabalhe conosco') {
                userState[from].step = 'trabalheConosco'; // Passa para o próximo passo de trabalhar conosco
                sendMessageWithDelay('Agradecemos o desejo de trabalhar conosco! Por favor, envie fotos do seu trabalho para avaliação.\n\nEstamos ansiosas para conhecer seu talento!', from);
            } else {
                sendMessageWithDelay('Desculpe, não entendi sua mensagem. Por favor, escolha uma das opções abaixo para continuar:\n\n1. Agendar horário\n2. Dúvidas\n3. Remarcar/Cancelar\n4. Redes sociais\n5. Trabalhe conosco', from);
            }
            break;

        case 'agendar':
            if (userMessage === 'sim') {
                userState[from].step = 'nomePenteado'; // Passa para o próximo passo de nome do penteado
                sendMessageWithDelay('Perfeito! Qual nome do penteado você escolheu?', from);
            } else if (userMessage === 'não') {
                userState[from].step = 'catalogo'; // Passa para o próximo passo de catálogo
                sendMessageWithDelay('Sem problemas! Acesse o nosso catálogo e escolha o penteado desejado. Se precisar de ajuda, é só falar!\n\nLink do catálogo: https://www.whatsapp.com/catalog/5511952801212/?app_absent=0', from);
            } else {
                sendMessageWithDelay('Desculpe, não entendi. Responda com "sim" ou "não" sobre o penteado que deseja.', from);
            }
            break;

        case 'nomePenteado':
            // Aqui o usuário escolhe o nome do penteado
            userState[from].step = 'ajudaMais'; // Passa para a etapa de "ajuda em algo mais"
            sendMessageWithDelay('Penteado escolhido com sucesso! Posso te ajudar em algo mais?', from);
            break;

        case 'ajudaMais':
            if (userMessage === 'sim') {
                sendMessageWithDelay('Ótimo! Como posso te ajudar? Escolha uma das opções abaixo:\n\n1. Agendar horário\n2. Dúvidas\n3. Remarcar/Cancelar\n4. Redes sociais\n5. Trabalhe conosco', from);
                userState[from].step = 'saudacao'; // Volta ao menu principal
            } else {
                sendMessageWithDelay('Que bom ter ajudado! Se precisar de algo mais, é só chamar. Até logo!', from);
                userState[from].step = 'start'; // Retorna ao início
            }
            break;

        case 'duvidas':
            sendMessageWithDelay('Agradecemos por entrar em contato! Responderemos sua dúvida assim que possível. Se precisar de mais informações, é só falar!', from);
            userState[from].step = 'ajudaMais'; // Após a dúvida, pergunta se pode ajudar em algo mais
            break;

        case 'remarcarCancelar':
            if (userMessage === 'remarcar') {
                userState[from].step = 'remarcarData'; // Passa para o passo de remarcar data
                sendMessageWithDelay('Por favor, informe a data que está agendada e a nova data que você deseja.', from);
            } else if (userMessage === 'cancelar') {
                userState[from].step = 'cancelarConfirmacao'; // Passa para o passo de confirmação de cancelamento
                sendMessageWithDelay('Lamentamos que precise cancelar. Podemos te ajudar de alguma forma?', from);
            } else {
                sendMessageWithDelay('Desculpe, não entendi. Responda com "remarcar" ou "cancelar".', from);
            }
            break;

        case 'redesSociais':
            sendMessageWithDelay('Confira nosso Instagram: https://www.instagram.com/paulatrancasealongamentos.\n\nSe precisar de mais informações, é só nos chamar!', from);
            userState[from].step = 'ajudaMais'; // Após dar as redes sociais, pergunta se precisa de ajuda
            break;

        case 'trabalheConosco':
            sendMessageWithDelay('Agradecemos o desejo de trabalhar conosco! Por favor, envie fotos do seu trabalho para avaliação.\n\nEstamos ansiosas para conhecer seu talento!', from);
            userState[from].step = 'ajudaMais'; // Após enviar instruções para trabalhar conosco, pergunta se precisa de ajuda
            break;

        default:
            userState[from].step = 'start';
            sendMessageWithDelay('Desculpe, não entendi sua mensagem. Por favor, escolha uma das opções abaixo para continuar:\n\n1. Agendar horário\n2. Dúvidas\n3. Remarcar/Cancelar\n4. Redes sociais\n5. Trabalhe conosco', from);
            break;
    }
});

// Evento de erro
client.on('error', error => {
    console.log('Erro no cliente:', error);
});

// Inicializar o cliente do WhatsApp
client.initialize();
