from comum import *

TOTAL = 12
DOC = 'Manual da Marca'


def pagina(n, titulo_secao, corpo, classe=''):
    rod = '' if n in (1, TOTAL) else f'''
    <footer class="rodape"><span>{logo(halo=False, estilo="height:3.2mm")}</span>
      <span>{DOC} · {titulo_secao}</span><span class="num">{n:02d}</span></footer>'''
    return f'<section class="pagina {classe}">{corpo}{rod}</section>'


def cabecalho(num, titulo, sub=''):
    s = f'<p class="lead">{sub}</p>' if sub else ''
    return f'<header class="cab"><div class="sec-num">{num}</div><h1>{titulo}</h1>{s}</header>'


def amostra(nome, hexa, rgb, cmyk, uso, texto_claro=True):
    cor_txt = '#fff' if texto_claro else GRAFITE
    borda = f'border:1px solid {BORDA};' if not texto_claro else ''
    return f'''<div class="amostra"><div class="cor" style="background:{hexa};color:{cor_txt};{borda}"><b>{nome}</b></div>
      <dl><dt>HEX</dt><dd>{hexa}</dd><dt>RGB</dt><dd>{rgb}</dd><dt>CMYK</dt><dd>{cmyk}</dd></dl><p>{uso}</p></div>'''


def errado(svg, legenda, fundo='#fff'):
    return f'''<figure class="errado"><div class="caixa" style="background:{fundo}">{svg}<span class="x">✕</span></div>
      <figcaption>{legenda}</figcaption></figure>'''


CSS = fontes_css() + f'''
@page {{ size: A4; margin: 0; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ font-family: 'Nunito', sans-serif; color: {GRAFITE}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ background: #888; }}
.pagina {{ width: 210mm; height: 297mm; background: #fff; position: relative; overflow: hidden;
  padding: 22mm 20mm 24mm; page-break-after: always; break-after: page; margin: 0 auto; }}
@media screen {{ .pagina {{ margin: 8mm auto; box-shadow: 0 2px 12px rgba(0,0,0,.25); }} }}
.rodape {{ position: absolute; left: 20mm; right: 20mm; bottom: 11mm; display: flex; align-items: center;
  justify-content: space-between; font-size: 7.5pt; color: {CINZA}; border-top: .4pt solid {BORDA}; padding-top: 3mm; letter-spacing: .02em; }}
.rodape .num {{ font-weight: 800; color: {AZUL}; }}
.cab {{ margin-bottom: 10mm; }}
.sec-num {{ font-size: 9pt; font-weight: 800; color: {AMBAR}; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 3mm; }}
h1 {{ font-size: 28pt; font-weight: 900; color: {AZUL}; line-height: 1.05; letter-spacing: -.01em; }}
h2 {{ font-size: 12.5pt; font-weight: 800; color: {AZUL}; margin: 7mm 0 2.5mm; }}
h3 {{ font-size: 10pt; font-weight: 800; color: {GRAFITE}; margin-bottom: 1.5mm; }}
p, li {{ font-size: 9.6pt; line-height: 1.55; color: {CINZA}; }}
p + p {{ margin-top: 2.5mm; }}
.lead {{ font-size: 11.5pt; line-height: 1.5; color: {CINZA}; margin-top: 4mm; max-width: 150mm; }}
b, strong {{ color: {GRAFITE}; font-weight: 800; }}
ul {{ padding-left: 4.5mm; }} li + li {{ margin-top: 1.2mm; }}
.grade2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }}
.grade3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }}
.painel {{ border-radius: 3mm; display: flex; align-items: center; justify-content: center; }}
.nota {{ background: {NEVOA}; border-left: 1.2mm solid {AMBAR}; padding: 4mm 5mm; border-radius: 0 2mm 2mm 0; margin-top: 6mm; }}
.nota p {{ color: {GRAFITE}; }}
.legenda {{ font-size: 8pt; color: {CINZA}; margin-top: 2mm; letter-spacing: .02em; }}

/* capa */
.capa {{ background: radial-gradient(circle at 39mm 107.2mm, rgba(244,165,28,.28) 0, rgba(244,165,28,.10) 38mm, rgba(244,165,28,0) 95mm), {AZUL}; color: #fff; padding: 0; }}
.capa .topo {{ position: absolute; top: 22mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between;
  font-size: 8.5pt; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.7); font-weight: 700; }}
.capa .marca {{ position: absolute; left: 20mm; top: 100mm; width: 130mm; }}
.capa .titulo {{ position: absolute; left: 20mm; bottom: 40mm; }}
.capa .titulo h1 {{ color: #fff; font-size: 40pt; }}
.capa .titulo p {{ color: rgba(255,255,255,.78); font-size: 12pt; margin-top: 4mm; }}
.capa .faixa {{ position: absolute; left: 0; right: 0; bottom: 0; height: 9mm; background: {AMBAR}; }}

/* sumário */
.sumario {{ list-style: none; padding: 0; margin-top: 4mm; }}
.sumario li {{ display: flex; align-items: baseline; gap: 4mm; padding: 3.2mm 0; border-bottom: .4pt solid {BORDA}; font-size: 11pt; color: {GRAFITE}; font-weight: 700; }}
.sumario li span:first-child {{ color: {AMBAR}; font-weight: 900; width: 9mm; }}
.sumario li span:last-child {{ margin-left: auto; color: {CINZA}; font-weight: 600; font-size: 9.5pt; }}

/* versões */
.versao .painel {{ height: 46mm; }}
.versao h3 {{ margin-top: 3mm; }}

/* proteção */
.protecao {{ position: relative; border: .5pt dashed {AZUL}; padding: 14mm; display: inline-block; background:
  repeating-linear-gradient(45deg, rgba(27,58,140,.05) 0 2mm, transparent 2mm 4mm); }}
.protecao .dentro {{ background: #fff; outline: .5pt solid rgba(27,58,140,.35); }}
.cota {{ position: absolute; font-size: 8pt; font-weight: 800; color: {AMBAR}; }}

/* incorreto */
.errado .caixa {{ position: relative; height: 34mm; border: .5pt solid {BORDA}; border-radius: 2mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }}
.errado .x {{ position: absolute; top: 1.5mm; right: 2mm; width: 5.5mm; height: 5.5mm; border-radius: 50%; background: #B42318; color: #fff;
  font-size: 7.5pt; font-weight: 900; display: flex; align-items: center; justify-content: center; }}
.errado figcaption {{ font-size: 8.5pt; color: {CINZA}; margin-top: 2mm; line-height: 1.4; }}

/* cores */
.amostras {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm 8mm; }}
.amostra .cor {{ height: 24mm; border-radius: 2.5mm; padding: 3mm 4mm; display: flex; align-items: flex-end; font-size: 10.5pt; }}
.amostra .cor b {{ color: inherit; }}
.amostra dl {{ display: grid; grid-template-columns: 11mm 1fr; font-size: 8.3pt; margin-top: 2mm; row-gap: .5mm; }}
.amostra dt {{ font-weight: 800; color: {GRAFITE}; }} .amostra dd {{ color: {CINZA}; font-variant-numeric: tabular-nums; }}
.amostra p {{ font-size: 8.3pt; margin-top: 1.5mm; line-height: 1.4; }}
.proporcao {{ display: flex; height: 9mm; border-radius: 2mm; overflow: hidden; margin-top: 3mm; border: .4pt solid {BORDA}; }}
.proporcao div {{ display: flex; align-items: center; padding-left: 3mm; font-size: 8pt; font-weight: 800; }}
table {{ width: 100%; border-collapse: collapse; font-size: 8.8pt; }}
th {{ text-align: left; font-weight: 800; color: {GRAFITE}; padding: 2mm 2mm; border-bottom: .8pt solid {AZUL}; }}
td {{ padding: 2.2mm 2mm; border-bottom: .4pt solid {BORDA}; color: {CINZA}; vertical-align: middle; }}
.par {{ display: inline-block; padding: 1mm 3mm; border-radius: 1.2mm; font-weight: 800; font-size: 8.5pt; }}
.ok {{ color: #157F3B; font-weight: 800; }} .nao {{ color: #B42318; font-weight: 800; }}

/* tipografia */
.aa {{ font-size: 88pt; font-weight: 900; color: {AZUL}; line-height: 1; }}
.pesos div {{ display: flex; justify-content: space-between; align-items: baseline; padding: 2mm 0; border-bottom: .4pt solid {BORDA}; }}
.pesos span:first-child {{ font-size: 15pt; color: {GRAFITE}; }}
.pesos span:last-child {{ font-size: 8pt; color: {CINZA}; }}
.escala div {{ display: flex; align-items: baseline; gap: 6mm; padding: 2.2mm 0; border-bottom: .4pt solid {BORDA}; }}
.escala small {{ width: 30mm; flex: none; font-size: 7.8pt; color: {CINZA}; }}
.alfabeto {{ font-size: 12pt; color: {GRAFITE}; letter-spacing: .04em; line-height: 1.6; margin-top: 3mm; }}

/* voz */
.dupla {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: .5pt solid {BORDA}; border-radius: 2.5mm; overflow: hidden; margin-top: 3mm; }}
.dupla div {{ padding: 2.6mm 4mm; font-size: 9pt; border-bottom: .4pt solid {BORDA}; }}
.dupla .h {{ font-weight: 900; font-size: 8pt; letter-spacing: .12em; text-transform: uppercase; }}
.dupla .s {{ background: #EEF7F1; color: #0F5C2B; }} .dupla .n {{ background: #FCEFEE; color: #8A1A12; }}
.dupla .n.v {{ text-decoration: line-through; text-decoration-thickness: .6pt; }}
.principios {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }}
.principios div {{ background: {NEVOA}; border-radius: 2.5mm; padding: 5mm; }}
.principios h3 {{ color: {AZUL}; font-size: 11pt; }}

/* aplicações */
.cartaz {{ background: {AZUL}; border-radius: 2mm; padding: 9mm 8mm; color: #fff; height: 118mm; position: relative; overflow: hidden; }}
.cartaz h4 {{ font-size: 17pt; font-weight: 900; line-height: 1.1; margin-top: 10mm; }}
.cartaz p {{ color: rgba(255,255,255,.85); font-size: 8.5pt; margin-top: 3mm; }}
.cartaz .qr {{ position: absolute; left: 8mm; bottom: 9mm; background: #fff; padding: 2.5mm; border-radius: 1.5mm; line-height: 0; }}
.cartaz .qr svg {{ width: 24mm; height: 24mm; }}
.cartaz .url {{ position: absolute; left: 39mm; bottom: 12mm; line-height:1.3; font-size: 8pt; font-weight: 800; color: {AMBAR}; }}
.cartaz .faixa {{ position: absolute; left: 0; right: 0; bottom: 0; height: 3mm; background: {AMBAR}; }}
.post {{ background: {NEVOA}; border-radius: 2mm; height: 56mm; padding: 6mm; position: relative; overflow: hidden; border: .4pt solid {BORDA}; }}
.post h4 {{ font-size: 12pt; font-weight: 900; color: {AZUL}; line-height: 1.15; margin-top: 5mm; width: 40mm; }}
.post .ponto {{ position: absolute; right: -14mm; bottom: -14mm; width: 46mm; height: 46mm; border-radius: 50%; background: {AMBAR}; opacity: .9; }}
.slide {{ background: #fff; border: .4pt solid {BORDA}; border-radius: 2mm; aspect-ratio: 16/9; padding: 6mm; position: relative; overflow: hidden; }}
.slide .barra {{ position: absolute; left: 0; top: 0; bottom: 0; width: 2.4mm; background: {AZUL}; }}
.slide h4 {{ font-size: 12pt; color: {AZUL}; font-weight: 900; margin-top: 4mm; }}
.slide p {{ font-size: 7.5pt; }}
.celular {{ width: 40mm; height: 80mm; border-radius: 6mm; background: {GRAFITE}; padding: 2mm; margin: 0 auto; }}
.celular .tela {{ background: {NEVOA}; height: 100%; border-radius: 4.5mm; padding: 6mm 3mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; align-content: start; }}
.celular .app {{ text-align: center; font-size: 5pt; color: {GRAFITE}; }}
.celular .app i {{ display: block; width: 9mm; height: 9mm; margin: 0 auto 1mm; border-radius: 2.2mm; background: {BORDA}; }}

/* faixa */
.faixa-ig {{ margin-top: 8mm; background: {AZUL}; border-radius: 2mm; height: 40mm; display: flex; align-items: center; gap: 7mm; padding: 0 8mm; border-bottom: 3mm solid {AMBAR}; }}
.faixa-ig .sep {{ width: .6pt; height: 18mm; background: rgba(255,255,255,.35); }}
.faixa-ig b {{ display: block; color: #fff; font-size: 13pt; white-space: nowrap; font-weight: 900; }}
.faixa-ig span {{ color: rgba(255,255,255,.8); font-size: 8.5pt; }}
.faixa-ig .qrb {{ margin-left: auto; background: #fff; padding: 2mm; border-radius: 1.5mm; line-height: 0; }}
.faixa-ig .qrb svg {{ width: 22mm; height: 22mm; }}
/* contracapa */
.contracapa {{ background: {PROFUNDO}; color: #fff; }}
.contracapa .centro {{ position: absolute; left: 20mm; right: 20mm; top: 50%; transform: translateY(-50%); text-align: center; }}
.contracapa p {{ color: rgba(255,255,255,.75); }}
.contracapa .faixa {{ position: absolute; left: 0; right: 0; bottom: 0; height: 9mm; background: {AMBAR}; }}
'''

