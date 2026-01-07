-- ============================================
-- NUOVE SFIDE DI SQUADRE
-- ============================================
-- Aggiunge 10 nuove sfide di squadre alla tabella giochi_template

-- Inserisci le nuove sfide (solo se non esistono già)
INSERT INTO giochi_template (nome, descrizione, emoji, min_squadre, max_squadre, punti_base) 
SELECT * FROM (VALUES
  ('SFIDA DI CANTO', 'Sfida di canto tra rappresentanti delle squadre. Ogni squadra sceglie un rappresentante che si esibisce in una performance canora.', '🎤', 2, 2, 60),
  ('SFIDA DI TUFFI', 'Sfida di tuffi tra due squadre. Ogni squadra presenta i suoi migliori tuffatori per una competizione di stile e difficoltà.', '🤿', 2, 2, 70),
  ('RUBA BANDIERA', 'Due squadre allineate, l''arbitro chiama un numero e i giocatori corrispondenti corrono per prendere la bandiera', '🚩', 2, 2, 50),
  ('TIRO ALLA FUNE', 'Due squadre tirano una corda in direzioni opposte. Vince la squadra che riesce a trascinare l''altra oltre la linea centrale.', '🪢', 2, 2, 50),
  ('CORSA CON CARRIOLA', 'Gara di corsa con carriola tra tutte le squadre. Un componente viene trasportato in carriola da un compagno di squadra.', '🛒', 2, 99, 60),
  ('PIADINE IN FACCIA', 'Sfida tra squadre dove i partecipanti si lanciano piadine in faccia. Vince la squadra che resiste meglio o che colpisce di più.', '🥞', 2, 2, 55),
  ('1, 2, 3 STELLA', 'Gioco classico dove un "guardiano" si gira e dice "1, 2, 3 stella" mentre gli altri avanzano. Tutte le squadre partecipano insieme.', '⭐', 2, 99, 50),
  ('CAMPO MINATO', 'Gioco dove alcuni partecipanti vengono bendati e guidati dai compagni di squadra attraverso un percorso a ostacoli.', '👁️‍🗨️', 2, 4, 65),
  ('CORSA COI SACCHI', 'Gara di corsa con i sacchi tra tutte le squadre. I partecipanti saltano dentro un sacco fino al traguardo.', '🛍️', 2, 99, 50),
  ('DODGEBALL', 'Gioco dove le squadre si lanciano palle per eliminare gli avversari. Vince l''ultima squadra con giocatori ancora in campo.', '⚾', 2, 4, 60)
) AS v(nome, descrizione, emoji, min_squadre, max_squadre, punti_base)
WHERE NOT EXISTS (
  SELECT 1 FROM giochi_template WHERE giochi_template.nome = v.nome
)
ON CONFLICT (nome) DO NOTHING;

-- Verifica che le sfide siano state inserite
SELECT 
  nome,
  emoji,
  min_squadre,
  max_squadre,
  punti_base
FROM giochi_template
WHERE nome IN (
  'SFIDA DI CANTO',
  'SFIDA DI TUFFI',
  'RUBA BANDIERA',
  'TIRO ALLA FUNE',
  'CORSA CON CARRIOLA',
  'PIADINE IN FACCIA',
  '1, 2, 3 STELLA',
  'CAMPO MINATO',
  'CORSA COI SACCHI',
  'DODGEBALL'
)
ORDER BY nome;
