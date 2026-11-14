"""Manual do usuário em PDF, no padrão da marca. Lê docs/manual.json (gerado por `npm run manual`).

Uso: python3 manual_usuario.py <docs/manual.json> [paginas.json]
O segundo argumento (opcional) traz as páginas de cada capítulo, para o sumário (2ª passada).
"""
import html, json, sys, re
from comum import *

dados = json.loads(pathlib.Path(sys.argv[1]).read_text())
paginas = json.loads(pathlib.Path(sys.argv[2]).read_text()) if len(sys.argv) > 2 and pathlib.Path(sys.argv[2]).exists() else {}
SECOES = {s['id']: s for s in dados['secoes']}
versao = '/'.join(reversed(dados['versao'].split('-')))

# capítulos vêm de src/lib/manual.ts (fonte única, a mesma do app)
CAPITULOS = [(c['id'], c['titulo'], c['resumo'], c['secoes']) for c in dados['capitulos']]
usados = {i for c in CAPITULOS for i in c[3]}
extras = [s['id'] for s in dados['secoes'] if s['id'] not in usados]
if extras:  # seção nova ainda sem capítulo: entra no fim, para nunca sumir do PDF
    CAPITULOS.append(('outros', 'Outras funções', 'Funções novas do app.', extras))


def t(s):
    """Escapa e destaca nomes de botões entre aspas."""
    s = html.escape(s, quote=False)
    return re.sub(r'"([^"]{1,40})"', r'<b>“\1”</b>', s)


def secao(s):
    passos = ''.join(f'<li>{t(p)}</li>' for p in s.get('passos', []))
    dicas = ''.join(f'<li>{t(d)}</li>' for d in s.get('dicas', []))
    curta = len(s.get('passos', [])) + len(s.get('dicas', [])) <= 6
    return f'''<article class="secao{' curta' if curta else ''}" id="{s['id']}">
  <h2>{t(s['titulo'])}</h2>
  <p class="resumo">{t(s['resumo'])}</p>
  {f'<ol class="passos">{passos}</ol>' if passos else ''}
  {f'<div class="dicas"><h3>Dicas</h3><ul>{dicas}</ul></div>' if dicas else ''}
</article>'''


CSS = fontes_css() + f'''
@page {{ size: A4; margin: 22mm 20mm 24mm;
  @bottom-left {{ content: "Manual do usuário · versão {versao}"; font: 600 7.5pt 'Nunito'; color: {CINZA}; }}
  @bottom-right {{ content: counter(page, decimal-leading-zero); font: 900 8pt 'Nunito'; color: {AZUL}; }} }}
@page capa {{ margin: 0; @bottom-left {{ content: none; }} @bottom-right {{ content: none; }} }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ font-family: 'Nunito', sans-serif; color: {GRAFITE}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
p, li {{ font-size: 10.6pt; line-height: 1.6; color: {CINZA}; }}
b, strong {{ color: {GRAFITE}; font-weight: 800; }}
.capa {{ page: capa; width: 210mm; height: 297mm; position: relative; overflow: hidden; color: #fff; break-after: page;
  background: radial-gradient(circle at 39mm 107.2mm, rgba(244,165,28,.28) 0, rgba(244,165,28,.10) 38mm, rgba(244,165,28,0) 95mm), {AZUL}; }}
.capa .topo {{ position: absolute; top: 22mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between;
  font-size: 8.5pt; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.7); font-weight: 700; }}
.capa .marca {{ position: absolute; left: 20mm; top: 100mm; width: 130mm; }}
.capa .sub {{ position: absolute; left: 20mm; bottom: 78mm; font-size: 9pt; letter-spacing: .2em; text-transform: uppercase; color: {AMBAR}; font-weight: 800; }}
.capa .titulo {{ position: absolute; left: 20mm; bottom: 40mm; }}
.capa h1 {{ color: #fff; font-size: 40pt; font-weight: 900; line-height: 1.05; }}
.capa .titulo p {{ color: rgba(255,255,255,.8); font-size: 12pt; margin-top: 4mm; }}
.capa .faixa {{ position: absolute; left: 0; right: 0; bottom: 0; height: 9mm; background: {AMBAR}; }}
.contracapa {{ background: {PROFUNDO}; }}
.contracapa .centro {{ position: absolute; left: 20mm; right: 20mm; top: 50%; transform: translateY(-50%); text-align: center; }}
.contracapa p {{ color: rgba(255,255,255,.75); }}
.links {{ margin-top: 12mm; display: flex; gap: 10mm; justify-content: center; align-items: center; text-align: left; }}
.links .qrb {{ background: #fff; padding: 3mm; border-radius: 2mm; line-height: 0; }}
.links .qrb svg {{ width: 34mm; height: 34mm; }}
.links p {{ font-size: 9.5pt; line-height: 1.9; }}

.rotulo {{ font-size: 9pt; font-weight: 800; color: {AMBAR}; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 3mm; }}
h1.pag {{ font-size: 28pt; font-weight: 900; color: {AZUL}; line-height: 1.08; }}
.lead {{ font-size: 12.5pt; line-height: 1.5; color: {CINZA}; margin-top: 4mm; max-width: 150mm; }}
.sumario {{ list-style: none; margin-top: 10mm; }}
.sumario li {{ display: flex; gap: 5mm; align-items: baseline; padding: 4.5mm 0; border-bottom: .4pt solid {BORDA}; }}
.sumario .n {{ color: {AMBAR}; font-weight: 900; font-size: 12pt; width: 9mm; }}
.sumario .c {{ flex: 1; }}
.sumario .c b {{ display: block; font-size: 13pt; color: {AZUL}; }}
.sumario .c span {{ font-size: 9.5pt; }}
.sumario .c i {{ font-style: normal; font-size: 8.5pt; color: {CINZA}; }}
.sumario .p {{ font-weight: 800; color: {GRAFITE}; }}
.comoler {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 10mm; }}
.comoler div {{ background: {NEVOA}; border-radius: 2.5mm; padding: 5mm; }}
.comoler b {{ display: block; color: {AZUL}; font-size: 10.5pt; margin-bottom: 1mm; }}
.comoler p {{ font-size: 9.2pt; line-height: 1.45; }}

.capitulo {{ break-before: page; }}
.abertura {{ background: {AZUL}; color: #fff; border-radius: 3mm; padding: 9mm 9mm 8mm; margin-bottom: 9mm; position: relative; overflow: hidden; }}
.abertura .num {{ font-size: 9pt; font-weight: 900; letter-spacing: .2em; color: {AMBAR}; text-transform: uppercase; }}
.abertura h1 {{ font-size: 26pt; font-weight: 900; margin-top: 2mm; color: #fff; }}
.abertura p {{ color: rgba(255,255,255,.85); font-size: 11pt; margin-top: 2mm; }}
.abertura::after {{ content: ''; position: absolute; right: -14mm; top: -14mm; width: 44mm; height: 44mm; border-radius: 50%;
  background: radial-gradient(circle, {AMBAR} 0 22%, rgba(244,165,28,.25) 23% 48%, transparent 49%); }}
.secao {{ margin-bottom: 7mm; }}
.secao + .secao {{ padding-top: 3mm; }}
.secao h2::before {{ content: ''; display: block; width: 10mm; height: 1.2mm; border-radius: 1mm; background: {AMBAR}; margin-bottom: 3mm; }}
.secao.curta {{ break-inside: avoid; }}
.passos li:last-child {{ break-after: avoid; }}
.dicas {{ break-before: avoid; }}
.secao h2 {{ font-size: 16pt; font-weight: 900; color: {AZUL}; margin-bottom: 2.5mm; break-after: avoid; }}
.resumo {{ font-size: 11pt; color: {GRAFITE}; margin-bottom: 4mm; }}
.passos {{ counter-reset: p; list-style: none; }}
.passos li {{ counter-increment: p; position: relative; padding: 0 0 3mm 11mm; break-inside: avoid; }}
.passos li::before {{ content: counter(p); position: absolute; left: 0; top: .2mm; width: 7mm; height: 7mm; border-radius: 50%;
  background: {AZUL}; color: #fff; font-weight: 900; font-size: 8.5pt; display: flex; align-items: center; justify-content: center; }}
.dicas {{ background: {NEVOA}; border-left: 1.2mm solid {AMBAR}; border-radius: 0 2mm 2mm 0; padding: 4mm 5mm; margin-top: 2mm; break-inside: avoid; }}
.dicas h3 {{ font-size: 8.5pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: #7A4D00; margin-bottom: 1.5mm; }}
.dicas ul {{ padding-left: 4.5mm; }}
.dicas li {{ font-size: 10pt; color: {GRAFITE}; }}
.dicas li + li {{ margin-top: 1mm; }}
.aviso {{ background: {AZUL}; color: #fff; border-radius: 2.5mm; padding: 6mm 7mm; margin-top: 4mm; display: flex; gap: 6mm; align-items: center; break-inside: avoid; }}
.aviso p {{ color: rgba(255,255,255,.9); }}
.aviso b {{ color: #fff; }}
.aviso .bola {{ flex: none; width: 9mm; height: 9mm; border-radius: 50%; background: {AMBAR}; box-shadow: 0 0 0 3mm rgba(244,165,28,.25); }}
'''

suma = ''.join(
    f'''<li><span class="n">{i:02d}</span><span class="c"><b>{nome}</b><span>{desc}</span><br>
    <i>{' · '.join(html.escape(SECOES[x]['titulo']) for x in ids)}</i></span><span class="p">{paginas.get(cid, '')}</span></li>'''
    for i, (cid, nome, desc, ids) in enumerate(CAPITULOS, 1))

caps = ''.join(
    f'''<section class="capitulo" data-cap="{cid}">
  <div class="abertura"><div class="num">Capítulo {i:02d}</div><h1>{nome}</h1><p>{desc}</p></div>
  {''.join(secao(SECOES[x]) for x in ids)}
</section>'''
    for i, (cid, nome, desc, ids) in enumerate(CAPITULOS, 1))

corpo = f'''
<section class="capa">
 <div class="topo"><span>Manual do usuário</span><span>Versão {versao}</span></div>
 <div class="marca">{logo(texto="#fff", estilo="width:130mm")}</div>
 <div class="sub">Libras ⇄ Português</div>
 <div class="titulo"><h1>Manual do usuário</h1><p>Como usar cada tela do Sinalume, passo a passo.</p></div>
 <div class="faixa"></div>
</section>
<section>
 <div class="rotulo">Sumário</div>
 <h1 class="pag">Tudo o que o app faz,<br>em poucos passos</h1>
 <p class="lead">O Sinalume é gratuito, abre no navegador do celular e não pede cadastro. Este manual segue a ordem das telas do app.</p>
 <ul class="sumario">{suma}</ul>
 <div class="comoler">
  <div><b>No app</b><p>Toque no “?” no alto de qualquer tela para abrir a parte do manual daquela tela.</p></div>
  <div><b>Passos numerados</b><p>Siga na ordem. Os nomes de botões aparecem em negrito, como no app.</p></div>
  <div><b>Sempre atualizado</b><p>Toda função nova entra no manual junto com o app.</p></div>
 </div>
</section>
{caps}
<section class="capa contracapa" style="break-before: page">
 <div class="centro">
  {logo(texto="#fff", halo=False, estilo="width:90mm")}
  <p style="margin-top:9mm;font-size:11pt">Tradução entre Libras e português, grátis e de código aberto.</p>
  <div class="links"><div class="qrb">{qr()}</div>
   <p>App: <b style="color:#fff">ktunda.github.io/sinalume</b><br>Sugestões: <b style="color:#fff">aba Sugestões do app</b><br>Código: <b style="color:#fff">github.com/ktunda/sinalume</b></p></div>
  <p style="margin-top:14mm;font-size:8pt;color:rgba(255,255,255,.55)">Manual do usuário · versão {versao}</p>
 </div><div class="faixa"></div>
</section>'''

saida = pathlib.Path(__file__).with_name('manual-usuario.html')
saida.write_text(f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Sinalume — Manual do usuário</title><style>{CSS}</style></head><body>{corpo}</body></html>')
print('ok', [c[0] for c in CAPITULOS])
