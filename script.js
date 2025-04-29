/*
criar um identificador de habilidade
*/


// definir dicionarios
let agentes = []
let agenteAtual = null
let agentesUsados = []
let acertos = 0
let erros = 0
let faseAtual = "agente"
let sugestaoIndex = -1


// pegando os elementos (dom da pag)
const imagemAgente = document.getElementById("agente-img")
const verificar = document.getElementById("verificar")
const feedback = document.getElementById("feedback")
const resposta = document.getElementById("resposta")
document.getElementById("acertos").textContent = `Acertos: ${acertos}`
document.getElementById("erros").textContent = `Erros: ${erros}`

//inicializar o script apos carregar a pag
document.addEventListener('DOMContentLoaded', iniciarJogo)

async function iniciarJogo() {
await buscarAgentes()
mostrarProxAgente()
resposta.addEventListener("input", mostrarSugestoes)
resposta.addEventListener("keydown", function(event) {
    const sugestoes = document.querySelectorAll(".sugestao-opcao")

    if (sugestoes.length === 0) return

    if (event.key === "ArrowDown") {
        event.preventDefault()
        sugestaoIndex = (sugestaoIndex + 1) % sugestoes.length
        atualizarHighlight(sugestoes)
    }

    if (event.key === "ArrowUp") {
        event.preventDefault()
        sugestaoIndex = (sugestaoIndex - 1 + sugestoes.length) % sugestoes.length
        atualizarHighlight(sugestoes)
    }

    if (event.key === "Tab") {
        event.preventDefault();
        if (sugestaoIndex === -1) sugestaoIndex = 0
        resposta.value = sugestoes[sugestaoIndex].textContent
        document.getElementById("sugestoes").innerHTML = ""
    }

    if (event.key === "Enter" && sugestaoIndex >= 0) {
        resposta.value = sugestoes[sugestaoIndex].textContent
        document.getElementById("sugestoes").innerHTML = ""
    }
});


resposta.addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        if (faseAtual === "agente") {
            verificarResposta(event)
        } else if (faseAtual === "habilidade") {
            verificarHabilidade(event)
        }
    }
});
}

/* crio uma funcão que busca os agentes usando a API, response usa para requisitar o api
*/
async function buscarAgentes() {
try {
    const apiUrl = "https://valorant-api.com/v1/agents?language=pt-BR&isPlayableCharacter=true"
    const response = await fetch(apiUrl)
    
    const data = await response.json()
    
    if (data.status !==200) {
        console.log('falha na api')
    } 
    agentes = data.data
        .filter(agente => agente.displayIcon)
        .map(agente => {
            return {
                uuid: agente.uuid,
                nome: agente.displayName,
                icone: agente.displayIcon,
                habilidades: agente.abilities.filter(hab => hab.displayIcon).map(hab => ({
                    slot: hab.slot,
                    nome: hab.displayName,
                    icone: hab.displayIcon
                }))
            };
        });
    return true;
} catch(erro){
    console.log('erro')
    return false
}  
}

function atualizarHighlight(sugestoes) {
    sugestoes.forEach((el, i) => {
        el.classList.toggle("highlight", i === sugestaoIndex)
    });
}
function atualizarPontuacao() {
    document.getElementById("acertos").textContent = `Acertos: ${acertos}`
    document.getElementById("erros").textContent = `Erros: ${erros}`
}

// escolhe aleatoriamente um agente
function obterAgenteAleatorio(){
    const agentesDisp = agentes.filter(agente => !agentesUsados.some(usado => usado.uuid === agente.uuid))
    if (agentesDisp.length === 0) {
        return null
    }
    const agenteAleatorio = Math.floor(Math.random()* agentesDisp.length)
    return agentesDisp[agenteAleatorio]
    }

function mostrarProxAgente() {
    feedback.textContent = ''
    resposta.value = ''
    resposta.disabled = false
    verificar.disabled = false
    faseAtual = "agente"

    const agente = obterAgenteAleatorio()
        if (!agente) {
            return
        }
    agenteAtual = agente
    agentesUsados.push(agente)
    imagemAgente.src = agente.icone
    imagemAgente.src = agente.icone;
    imagemAgente.style.display = "block"
    setTimeout(()=>{
        resposta.focus()
    },300)
    }

    


// cria a função para verificar a resposta
function verificarResposta(event) {
    if (event && event.preventDefault)
        event.preventDefault()
// verifica se o campo esta vazio e exibe mensagem de erro caso esteja
    const respostaUsuario = resposta.value.trim()
    const mensagemErro = document.getElementById("msg-erro")

    if (respostaUsuario === ""){
        mensagemErro.textContent = "Preencha o campo por favor."
        return
    }
    else {
    mensagemErro.textContent = ""
    }

    const sugestoesContainer = document.getElementById("sugestoes")
    sugestoesContainer.innerHTML = ""
    
    if (faseAtual === "agente") {
        const respCorreta = respostaUsuario.toLowerCase() === agenteAtual.nome.toLowerCase()
        if (respCorreta) {
            acertos++
            atualizarPontuacao()
            feedback.textContent = `Correto, o agente era ${agenteAtual.nome}`
            feedback.style.color = "white"
            faseAtual = "habilidade"
            setTimeout(() => {
                mostrarHabilidade()
            }, 2000)
            return
        }
        else {
            erros++
            atualizarPontuacao()
            feedback.textContent = `Errou, o agente era ${agenteAtual.nome}`
            feedback.style.color = "white"
            setTimeout(mostrarProxAgente, 2000)
        }
    } else if (faseAtual === "habilidade"){
        const habilidade = agenteAtual.habilidadeAtual
        const respCorreta = respostaUsuario.toLowerCase() === habilidade.nome.toLowerCase()
        if (respCorreta) {
            acertos++
            feedback.textContent = `Correto! A habilidade era "${habilidade.nome}".`
        } else {
            erros++
            feedback.textContent = `Errou! Era "${habilidade.nome}".`
        }
        
        feedback.style.color = "white"
        faseAtual = "agente"
        setTimeout(() => {
            document.getElementById("habilidade-img").style.display = "none"
            mostrarProxAgente()
        }, 2500);
    }

    resposta.disabled = false
    verificar.disabled = false
    verificar.onclick = verificarHabilidade;
}



function mostrarSugestoes(event) {
    const inputValue = event.target.value.toLowerCase();
    const sugestoesContainer = document.getElementById("sugestoes");
    sugestoesContainer.innerHTML = ""
    sugestaoIndex = -1; // resetar índice ao gerar sugestões

    let lista = [];

    if (faseAtual === "agente") {
        if (inputValue === "") return;

        lista = agentes
            .filter(agente => agente.nome.toLowerCase().startsWith(inputValue))
            .sort((a, b) => a.nome.localeCompare(b.nome))
    } else if (faseAtual === "habilidade" && agenteAtual && agenteAtual.habilidades) {
        lista = agenteAtual.habilidades
            .filter(hab => hab.nome.toLowerCase().startsWith(inputValue))
            .sort((a, b) => a.nome.localeCompare(b.nome))
    }

    lista.forEach((item, i) => {
        const divOpcao = document.createElement("div")
        divOpcao.classList.add("sugestao-opcao")
        divOpcao.textContent = item.nome
        divOpcao.onclick = () => {
            resposta.value = item.nome;
            sugestoesContainer.innerHTML = ""
        };
        sugestoesContainer.appendChild(divOpcao)
    });
}



function verificarHabilidade() {
    const respostaUsuario = resposta.value.trim()
    if (respostaUsuario === "") {
        document.getElementById("msg-erro").textContent = "Preencha o campo por favor."
        return;
    }

    const respCorreta = respostaUsuario.toLowerCase() === agenteAtual.habilidadeAtual.nome.toLowerCase();

    resposta.placeholder = `Digite o nome do agente:`
    resposta.disabled = true
    verificar.disabled = true

    if (respCorreta) {
        acertos++
        atualizarPontuacao()
        feedback.textContent = `Correto! Era  "${agenteAtual.habilidadeAtual.nome}".`
    } else {
        erros++
        atualizarPontuacao()
        feedback.textContent = `Errou! Era "${agenteAtual.habilidadeAtual.nome}".`
    }

    feedback.style.color = "white"

    setTimeout(() => {
        const imgHabilidade = document.getElementById("habilidade-img")
        if (imgHabilidade) imgHabilidade.style.display = "none"
        faseAtual = "agente"
        mostrarProxAgente()
        verificar.onclick = verificarResposta
    }, 2500);
    
}

function mostrarHabilidade() {
    imagemAgente.style.display = "none"
    if (!agenteAtual || !agenteAtual.habilidades || agenteAtual.habilidades.length === 0) {
        return;
    }

    const habilidade = agenteAtual.habilidades[Math.floor(Math.random() * agenteAtual.habilidades.length)];
    agenteAtual.habilidadeAtual = habilidade;
    feedback.textContent = ""

    const imgHabilidade = document.getElementById("habilidade-img")
    if (imgHabilidade) {
        imgHabilidade.src = habilidade.icone
        imgHabilidade.alt = habilidade.nome
        imgHabilidade.style.display = "block"
    }

    resposta.placeholder = `Digite o nome da habilidade:`
    resposta.value = ""
    resposta.disabled = false
    resposta.focus()

    faseAtual = "habilidade"
    verificar.disabled = false
    verificar.onclick = verificarHabilidade
}

