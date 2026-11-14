import base
from base import *

base.TOTAL = 10
base.DOC = 'Apresentação do projeto'

EXTRA = f'''
p, li {{ font-size: 10.6pt; }} .lead {{ font-size: 12.5pt; }} td, th {{ font-size: 9.8pt; padding-top: 2.8mm; padding-bottom: 2.8mm; }} h2 {{ font-size: 13.5pt; margin-top: 9mm; }}

.capa .titulo h1 {{ font-size: 36pt; }}
.capa .sub {{ position: absolute; left: 20mm; bottom: 86mm; font-size: 9pt; letter-spacing: .2em; text-transform: uppercase; color: {AMBAR}; font-weight: 800; }}
.numeros {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; margin-top: 8mm; }}
.numeros div {{ border-top: 1.2mm solid {AMBAR}; padding-top: 3mm; }}
.numeros b {{ display: block; font-size: 20pt; font-weight: 900; color: {AZUL}; line-height: 1.1; }}
.numeros span {{ font-size: 8.3pt; color: {CINZA}; line-height: 1.35; display: block; margin-top: 1mm; }}
.cards {{ display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }}
.card {{ background: {NEVOA}; border-radius: 2.5mm; padding: 5.5mm 6mm; }}
.card h3 {{ color: {AZUL}; font-size: 11.5pt; }}
.card p {{ font-size: 9.8pt; }}
.fluxo {{ display: grid; grid-template-columns: 1fr 9mm 1fr 9mm 1fr; align-items: stretch; margin-top: 4mm; }}
.fluxo .passo {{ border: .5pt solid {BORDA}; border-radius: 2.5mm; padding: 4mm; background: #fff; }}
.fluxo .passo.dest {{ background: {AZUL}; border-color: {AZUL}; }}
.fluxo .passo.dest h3, .fluxo .passo.dest p {{ color: #fff; }}
.fluxo .seta {{ display: flex; align-items: center; justify-content: center; color: {AMBAR}; font-size: 16pt; font-weight: 900; }}
.fluxo h3 {{ font-size: 10pt; color: {AZUL}; }}
.fluxo p {{ font-size: 9.4pt; line-height: 1.45; }}
.etiqueta {{ display: inline-block; font-size: 7.8pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: {AZUL};
  background: #E8EDF8; padding: 1mm 2.6mm; border-radius: 1mm; margin-top: 8mm; }}
.etiqueta.amb {{ background: #FDF1DC; color: #7A4D00; }}
.tela-nome {{ white-space: nowrap; font-weight: 800; color: {AZUL}; }}
.passos {{ counter-reset: p; list-style: none; padding: 0; }}
.passos li {{ counter-increment: p; position: relative; padding: 0 0 3.2mm 11mm; }}
.passos li::before {{ content: counter(p); position: absolute; left: 0; top: -.4mm; width: 7mm; height: 7mm; border-radius: 50%;
  background: {AZUL}; color: #fff; font-weight: 900; font-size: 8.5pt; display: flex; align-items: center; justify-content: center; }}
.ciclo {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; margin-top: 3mm; }}
.ciclo div {{ background: {NEVOA}; border-radius: 2.5mm; padding: 4mm 3.5mm; position: relative; }}
.ciclo b {{ display: block; color: {AZUL}; font-size: 10pt; margin-bottom: 1mm; }}
.ciclo i {{ font-style: normal; font-weight: 900; color: {AMBAR}; font-size: 8pt; letter-spacing: .1em; }}
.ciclo p {{ font-size: 9pt; line-height: 1.4; }}
.faq h3 {{ color: {AZUL}; margin-top: 4mm; }}
.faq p {{ font-size: 10pt; }}
.destaque {{ background: {AZUL}; color: #fff; border-radius: 2.5mm; padding: 6mm 7mm; margin-top: 7mm; display: flex; gap: 6mm; align-items: center; }}
.destaque p {{ color: rgba(255,255,255,.88); font-size: 10pt; }}
.destaque b {{ color: #fff; }}
.destaque .bola {{ flex: none; width: 9mm; height: 9mm; border-radius: 50%; background: {AMBAR}; box-shadow: 0 0 0 3mm rgba(244,165,28,.25); }}
.links {{ margin-top: 12mm; display: flex; gap: 10mm; justify-content: center; align-items: center; text-align: left; }}
.links .qrb {{ background: #fff; padding: 3mm; border-radius: 2mm; line-height: 0; }}
.links .qrb svg {{ width: 34mm; height: 34mm; }}
.links p {{ font-size: 9.5pt; line-height: 1.9; }}
'''

P = []

# 1 capa
P.append(pagina(1, '', f'''
<div class="topo"><span>Apresentação do projeto</span><span>Novembro de 2026</span></div>
<div class="marca">{logo(texto="#fff", estilo="width:130mm")}</div>
<div class="sub">Libras ⇄ Português</div>
<div class="titulo"><h1>Tradução entre Libras<br>e português, no celular</h1><p>Grátis, sem anúncios e de código aberto. Feito para a comunidade surda,<br>para famílias de baixa renda e para comunidades cristãs.</p></div>
<div class="faixa"></div>''', 'capa'))

# 2 o que é
P.append(pagina(2, 'O que é', f'''
{cabecalho('01 · O que é o Sinalume', 'Uma ponte entre quem sinaliza e quem fala', 'O Sinalume é um aplicativo gratuito que ajuda pessoas surdas e ouvintes a conversarem, traduzindo entre Libras e português direto no celular. Foi criado para servir à comunidade surda, não para vender.')}
<p>No Brasil, muita gente surda passa o dia sem conseguir se comunicar em lugares simples: na recepção de um posto de saúde, numa loja, no culto da igreja. Intérpretes de Libras fazem um trabalho insubstituível, mas não estão em todo lugar. O Sinalume quer diminuir essa distância nas conversas do dia a dia.</p>
<div class="numeros">
 <div><b>R$ 0</b><span>para quem usa e para manter o projeto</span></div>
 <div><b>2</b><span>sentidos: Libras para português e português para Libras</span></div>
 <div><b>0,5 MB</b><span>na primeira abertura, pensado para celulares simples</span></div>
 <div><b>iPhone e Android</b><span>com as mesmas funções, direto no navegador</span></div>
</div>
<h2 style="margin-top:10mm">Para quem é</h2>
<div class="cards">
 <div class="card"><h3>Pessoas surdas e suas famílias</h3><p>Quem usa Libras no dia a dia e precisa ser entendido por quem não sabe a língua.</p></div>
 <div class="card"><h3>Ouvintes que querem conversar</h3><p>Atendentes, vizinhos, colegas de trabalho e membros de igreja.</p></div>
 <div class="card"><h3>Igrejas, associações e escolas</h3><p>Lugares que acolhem pessoas surdas e querem incluir mais.</p></div>
 <div class="card"><h3>Quem tem pouco recurso</h3><p>Funciona em celular simples, sem cadastro, sem anúncios e sem pagar nada.</p></div>
</div>
<div class="destaque"><div class="bola"></div><p><b>Endereço do app:</b> ktunda.github.io/sinalume — abre no navegador do celular, sem baixar nada da loja.</p></div>'''))

# 3 como funciona
P.append(pagina(3, 'Como funciona', f'''
{cabecalho('02 · Como funciona', 'O mesmo celular para os dois lados da conversa', 'A pessoa surda sinaliza e o ouvinte entende. O ouvinte fala e a pessoa surda vê em Libras.')}
<span class="etiqueta">Libras → português</span>
<div class="fluxo">
 <div class="passo"><h3>A pessoa surda sinaliza</h3><p>O ouvinte aponta a câmera do celular para ela.</p></div><div class="seta">→</div>
 <div class="passo"><h3>O app lê as mãos</h3><p>Os movimentos viram pontos e são comparados com sinais gravados pela comunidade.</p></div><div class="seta">→</div>
 <div class="passo dest"><h3>Texto e voz</h3><p>A frase aparece na tela e é falada em voz alta para o ouvinte.</p></div>
</div>
<span class="etiqueta amb">Português → Libras</span>
<div class="fluxo">
 <div class="passo"><h3>O ouvinte fala</h3><p>Segura o botão e fala, ou digita a mensagem.</p></div><div class="seta">→</div>
 <div class="passo"><h3>A fala vira texto</h3><p>Pelo serviço de voz do navegador ou pela transcrição no próprio aparelho.</p></div><div class="seta">→</div>
 <div class="passo dest"><h3>Legenda e avatar</h3><p>A legenda aparece grande e o avatar 3D do VLibras faz os sinais em Libras.</p></div>
</div>
<div class="nota" style="margin-top:9mm"><p><b>Aprende com a comunidade.</b> Para reconhecer sinais, o app compara o movimento das mãos com exemplos gravados por voluntários. Quanto mais pessoas contribuem, mais sinais ele entende.</p></div>
<p style="margin-top:5mm">O avatar em Libras é o do <b>VLibras</b>, ferramenta pública e gratuita do Governo Federal com a Universidade Federal da Paraíba. O Sinalume usa esse avatar e soma a ele o reconhecimento de sinais pela câmera, que o VLibras não faz.</p>'''))

# 4 funcionalidades
linhas = [
    ('Surdo sinaliza', 'O ouvinte aponta a câmera para a pessoa surda. Os sinais viram texto na tela e voz.', 'Ouvinte conversando com uma pessoa surda'),
    ('Ouvinte fala', 'O ouvinte segura o botão e fala (ou digita). A fala vira legenda grande e o avatar faz os sinais.', 'Pessoa surda acompanhando o ouvinte'),
    ('Modo culto', 'Nos dois sentidos: pregação em legenda e Libras no telão, e a pessoa surda sinalizando para a igreja.', 'Igrejas, palestras, reuniões'),
    ('Ensinar sinais', 'Voluntários gravam sinais (5 vezes cada) e enviam para a base da comunidade, inclusive regionais.', 'Pessoas surdas, intérpretes'),
    ('Sinais que temos', 'Mostra quais sinais estão prontos, quais precisam de mais pessoas e quais faltam gravar.', 'Quem quer completar o vocabulário'),
    ('Sugestões', 'Ideias, avisos de erro, pedidos de sinais e pedidos de remoção das próprias gravações. Sem conta.', 'Todos'),
    ('Manual', 'Explica cada tela passo a passo. Fica no botão “?” de cada tela.', 'Todos'),
    ('Sobre e privacidade', 'Explica o que o app faz com os dados e dá os créditos.', 'Todos'),
]
tab = ''.join(f'<tr><td class="tela-nome">{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in linhas)
P.append(pagina(4, 'Funcionalidades', f'''
{cabecalho('03 · Funcionalidades', 'Uma tela para cada situação', 'Letras grandes, botões grandes e poucos passos. O app se instala na tela inicial, como um aplicativo comum.')}
<table><tr><th style="width:36mm">Tela</th><th>Para que serve</th><th style="width:44mm">Quem usa</th></tr>{tab}</table>
<div class="cards" style="margin-top:8mm">
 <div class="card"><h3>Transcrição no aparelho</h3><p>A fala pode ser transcrita no próprio celular, sem internet, com um modelo preciso (249 MB) ou leve (77 MB), baixado uma vez.</p></div>
 <div class="card"><h3>Troca sem internet</h3><p>Sinais gravados podem ser exportados em arquivo e importados em outro celular, para mutirões em lugares sem sinal.</p></div>
</div>'''))

# 5 igrejas
P.append(pagina(5, 'Para igrejas', f'''
{cabecalho('04 · Para igrejas', 'Incluir a pessoa surda no culto', 'Muitas igrejas têm ministérios com pessoas surdas, mas nem sempre há intérprete em todo culto. O Sinalume foi pensado para ajudar nesses momentos.')}
<div class="grade2">
 <div class="card" style="background:{AZUL}"><h3 style="color:{AMBAR}">Pregação → Libras</h3><p style="color:rgba(255,255,255,.9)">Ligue um celular ou notebook ao projetor ou à TV. O app escuta a pregação e mostra a legenda grande, com o avatar sinalizando.</p></div>
 <div class="card" style="background:{AZUL}"><h3 style="color:{AMBAR}">Libras → igreja</h3><p style="color:rgba(255,255,255,.9)">A câmera lê os sinais de um membro surdo e o app mostra o texto e fala para todos, num testemunho ou numa oração.</p></div>
</div>
<h2>Também ajuda em</h2>
<ul>
 <li><b>Acolhimento na porta:</b> um membro ouvinte pode conversar com um visitante surdo, nos dois sentidos, pelo próprio celular.</li>
 <li><b>Vocabulário religioso:</b> o app já começa com sinais como Deus, Jesus, Espírito Santo, oração, culto, Bíblia, louvor, amém, irmão, paz, graça, bênção, perdão, célula, batismo e ceia. Cada igreja pode gravar os sinais que usa, inclusive variações da sua região.</li>
 <li><b>Ministérios de surdos como parceiros:</b> intérpretes e membros surdos são as pessoas mais preparadas para gravar e revisar sinais. Um mutirão de uma tarde já faz diferença.</li>
</ul>
<h2>Para funcionar bem</h2>
<ul>
 <li>Deixe o microfone perto de quem fala ou ligado à mesa de som; música alta atrapalha a transcrição.</li>
 <li>Para a igreja ouvir a voz do app, ligue a saída de som do aparelho à mesa de som.</li>
</ul>
<div class="nota"><p>O Sinalume <b>não substitui o intérprete</b> no culto. Ele ajuda quando não há intérprete e aproxima quem ainda não sabe Libras.</p></div>
<div class="faixa-ig">{logo(texto="#fff", halo=False, estilo="width:46mm")}<div class="sep"></div>
 <div><b>Tradução em Libras neste culto</b><span>Aponte a câmera para o código e abra o Sinalume</span></div>
 <div class="qrb">{qr(escala=2)}</div></div>'''))

# 6 como ajudar
P.append(pagina(6, 'Como ajudar', f'''
{cabecalho('05 · Como ajudar', 'O Sinalume aprende com a comunidade', 'Quanto mais pessoas gravam sinais, melhor ele reconhece todo mundo.')}
<div class="grade2">
 <div><h2 style="margin-top:0">Gravar sinais</h2><p style="margin-bottom:4mm">Para pessoas surdas e intérpretes.</p>
  <ol class="passos">
   <li>Abra o app e toque em <b>Ensinar sinais</b>.</li>
   <li>Digite o sinal ou escolha na lista. Prefira os que aparecem como “Falta gravar” em <b>Sinais que temos</b>.</li>
   <li>Com boa luz e mãos e rosto aparecendo, faça o sinal e abaixe as mãos. Repita 5 vezes.</li>
   <li>Toque em <b>Enviar minhas gravações</b>, leia o termo e confirme.</li>
  </ol></div>
 <div><h2 style="margin-top:0">Organizar um mutirão</h2><p style="margin-bottom:4mm">Para igrejas, associações e escolas.</p>
  <ul>
   <li>Reúna de 5 a 20 pessoas que sinalizam, de idades e lugares diferentes.</li>
   <li>Escolha uma categoria por encontro, como “Igreja” ou “Saúde”.</li>
   <li>Cada pessoa grava os mesmos sinais. Variedade de pessoas vale mais que muitas gravações de uma pessoa só.</li>
  </ul></div>
</div>
<h2>Sem gravar</h2>
<div class="grade3">
 <div class="card"><h3>Sugira</h3><p>Use a aba Sugestões para avisar de erros, pedir sinais e dar ideias.</p></div>
 <div class="card"><h3>Divulgue</h3><p>Apresente o app a pessoas surdas, famílias, igrejas e escolas.</p></div>
 <div class="card"><h3>Programe</h3><p>Quem programa pode contribuir no código aberto do projeto.</p></div>
</div>'''))

# 7 privacidade
P.append(pagina(7, 'Privacidade', f'''
{cabecalho('06 · Privacidade e consentimento', 'O vídeo nunca sai do celular', 'Para reconhecer sinais, o app transforma as mãos em pontos (números com a posição de cada dedo) no próprio aparelho.')}
<table>
 <tr><th style="width:62mm">O que acontece</th><th>Onde</th></tr>
 <tr><td><b>Vídeo da câmera</b></td><td>Só no celular; não é gravado nem enviado</td></tr>
 <tr><td><b>Sinais gravados</b></td><td>Ficam no celular até a pessoa decidir enviar</td></tr>
 <tr><td><b>Fala do ouvinte</b></td><td>Transcrita pelo serviço de voz do navegador ou no próprio aparelho</td></tr>
 <tr><td><b>Texto a ser sinalizado</b></td><td>Enviado ao VLibras para virar Libras</td></tr>
 <tr><td><b>Cadastro, login, anúncios, rastreamento</b></td><td>Não existem</td></tr>
</table>
<h2>Doação de sinais com consentimento</h2>
<p>Antes de enviar gravações, a pessoa lê o Termo de consentimento no app e confirma duas coisas:</p>
<ul>
 <li>que autoriza o Sinalume a usar e compartilhar publicamente os pontos das mãos, sob a licença aberta CC BY 4.0;</li>
 <li>que tem 18 anos ou mais, ou que é o responsável legal por quem gravou.</li>
</ul>
<p>Cada envio registra a versão do termo e a data do aceite. Apelido e estado são opcionais; nome completo, telefone, e-mail e endereço não são pedidos.</p>
<h2>Direito de remoção</h2>
<p>Cada envio recebe um código e uma <b>chave secreta de remoção</b>, que só o celular de quem enviou conhece. Com eles, a pessoa pede a remoção na aba Sugestões, e as gravações saem do acervo. A chave impede que outra pessoa peça a remoção no lugar dela. Cópias já baixadas por terceiros sob a licença aberta não podem ser recolhidas.</p>
<div class="nota"><p>O Sinalume reconhece um vocabulário limitado e pode errar. Em consultas médicas, assuntos jurídicos e outras situações importantes, procure um intérprete de Libras.</p></div>'''))

# 8 gratuito + evolução
P.append(pagina(8, 'Gratuito e aberto', f'''
{cabecalho('07 · Gratuito e aberto', 'Custo zero para usar e para manter', 'O Sinalume não tem fins comerciais, anúncios nem planos pagos.')}
<div class="cards">
 <div class="card"><h3>Funciona no navegador</h3><p>Abre pelo endereço e pode ser instalado na tela inicial, sem loja de aplicativos.</p></div>
 <div class="card"><h3>Funciona sem internet</h3><p>Depois do primeiro uso, ler sinais e transcrever a fala no aparelho funcionam offline. Só o avatar precisa de internet.</p></div>
 <div class="card"><h3>Código aberto</h3><p>Qualquer pessoa pode ver, usar e melhorar o projeto. Licença GPL-3.0.</p></div>
 <div class="card"><h3>Dados abertos</h3><p>Os sinais doados formam um acervo público (CC BY 4.0) que pode ajudar outros projetos.</p></div>
</div>
<p style="margin-top:5mm">Ferramentas públicas e gratuitas: avatar VLibras (Governo Federal e UFPB), detecção de mãos MediaPipe (Google) e bancos públicos de sinais de Libras usados na pesquisa brasileira.</p>
<h2>Como o Sinalume evolui</h2>
<p>Hoje o app reconhece sinais um de cada vez, com uma pausa entre eles, e só os que a comunidade já gravou. Ele melhora em um ciclo contínuo:</p>
<div class="ciclo">
 <div><i>01</i><b>Priorizar</b><p>A tela Sinais que temos mostra o que falta; pedidos entram na fila.</p></div>
 <div><i>02</i><b>Gravar</b><p>Voluntários gravam os sinais que faltam, 5 vezes cada.</p></div>
 <div><i>03</i><b>Revisar</b><p>Uma verificação automática aponta gravações suspeitas; a coordenação aprova.</p></div>
 <div><i>04</i><b>Publicar</b><p>Sinais aprovados chegam a todos em “Atualizar sinais da comunidade”.</p></div>
 <div><i>05</i><b>Medir</b><p>Um sinal fica pronto com 10 gravações de pelo menos 3 pessoas.</p></div>
</div>'''))

# 9 marcos + faq
P.append(pagina(9, 'Próximos passos', f'''
{cabecalho('08 · Próximos passos', 'Marcos e perguntas frequentes')}
<table>
 <tr><th>Próximo marco</th><th style="width:72mm">Quando</th></tr>
 <tr><td>Testes com pessoas surdas</td><td>Vocabulário inicial pronto</td></tr>
 <tr><td>Reconhecimento mais esperto (rede neural)</td><td>Com 150 sinais prontos ou 2.000 gravações</td></tr>
 <tr><td>Frases sem pausa entre sinais</td><td>Quando sinais isolados acertarem 90% com pessoas novas</td></tr>
 <tr><td>Expressões faciais (perguntas, negação)</td><td>Depois das frases</td></tr>
 <tr><td>Pacotes por tema: saúde, escola, trabalho, igreja</td><td>Conforme os pedidos da comunidade</td></tr>
</table>
<div class="faq grade2" style="margin-top:4mm">
 <div>
  <h3>Preciso pagar ou criar conta?</h3><p>Não. O app é gratuito e não pede cadastro.</p>
  <h3>Funciona no iPhone?</h3><p>Sim, com as mesmas funções do Android. No iPhone, abra pelo Safari e toque em Compartilhar › Adicionar à Tela de Início.</p>
  <h3>Funciona sem internet?</h3><p>Ler sinais pela câmera e transcrever a fala no aparelho, sim. O avatar em Libras precisa de internet.</p>
 </div>
 <div>
  <h3>Por que não reconheceu meu sinal?</h3><p>Ele pode ainda não ter sido gravado, ou ter sido gravado de outro jeito. Grave do seu jeito: variações regionais são bem-vindas.</p>
  <h3>Minhas gravações mostram meu rosto?</h3><p>Não. Só os pontos das mãos são enviados, nunca o vídeo.</p>
  <h3>O app substitui o intérprete?</h3><p>Não. Ele ajuda em conversas simples quando não há intérprete.</p>
 </div>
</div>'''))

# 10 contracapa
P.append(pagina(10, '', f'''
<div class="centro">
 {logo(texto="#fff", halo=False, estilo="width:90mm")}
 <p style="margin-top:9mm;font-size:11pt">Tradução entre Libras e português, grátis e de código aberto.</p>
 <div class="links"><div class="qrb">{qr()}</div>
  <p>App: <b style="color:#fff">ktunda.github.io/sinalume</b><br>Sugestões: <b style="color:#fff">github.com/ktunda/sinalume/issues</b><br>Código: <b style="color:#fff">github.com/ktunda/sinalume</b></p></div>
 <p style="margin-top:14mm;font-size:8pt;color:rgba(255,255,255,.55)">Apresentação do projeto · novembro de 2026</p>
</div><div class="faixa"></div>''', 'contracapa'))

html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Sinalume — Apresentação do projeto</title><style>{CSS}{EXTRA}</style></head><body>{"".join(P)}</body></html>'
pathlib.Path(__file__).with_name('apresentacao.html').write_text(html)
print('ok')
