-- ============================================
-- CREA 100 QUEST PER UTENTI SINGOLI
-- ============================================
-- Queste quest sono disponibili per essere assegnate casualmente agli utenti

-- Rimuovi le quest esistenti (opzionale, commenta se vuoi mantenerle)
-- DELETE FROM quest;

-- Inserisci 100 quest diverse
INSERT INTO quest (giorno, titolo, descrizione, punti, difficolta, tipo_prova, emoji, attiva) VALUES
-- FACILI (20-30 punti)
(1, 'Selfie con il mare', 'Fai un selfie con il mare sullo sfondo', 20, 'facile', ARRAY['foto'], '🌊', true),
(1, 'Foto del tramonto', 'Cattura un bellissimo tramonto', 25, 'facile', ARRAY['foto'], '🌅', true),
(1, 'Video del cibo', 'Registra un video del tuo piatto preferito', 20, 'facile', ARRAY['video'], '🍕', true),
(1, 'Selfie con amici', 'Fai un selfie di gruppo con i tuoi amici', 25, 'facile', ARRAY['foto'], '👥', true),
(1, 'Foto del paesaggio', 'Scatta una foto di un paesaggio che ti colpisce', 20, 'facile', ARRAY['foto'], '🏞️', true),
(1, 'Video di una risata', 'Registra qualcuno che ride di gusto', 20, 'facile', ARRAY['video'], '😂', true),
(1, 'Selfie con animale', 'Fai un selfie con un animale (cane, gatto, uccello...)', 25, 'facile', ARRAY['foto'], '🐕', true),
(1, 'Foto del cielo', 'Cattura il cielo in un momento particolare', 20, 'facile', ARRAY['foto'], '☁️', true),
(1, 'Video di una danza', 'Registra qualcuno che balla', 25, 'facile', ARRAY['video'], '💃', true),
(1, 'Selfie con cappello', 'Fai un selfie indossando un cappello divertente', 20, 'facile', ARRAY['foto'], '🎩', true),
(1, 'Foto di un fiore', 'Scatta una foto di un fiore particolare', 20, 'facile', ARRAY['foto'], '🌸', true),
(1, 'Video di un saluto', 'Registra un saluto creativo', 20, 'facile', ARRAY['video'], '👋', true),
(1, 'Selfie con occhiali da sole', 'Fai un selfie con occhiali da sole', 20, 'facile', ARRAY['foto'], '🕶️', true),
(1, 'Foto di un monumento', 'Scatta una foto di un monumento o edificio interessante', 25, 'facile', ARRAY['foto'], '🏛️', true),
(1, 'Video di un brindisi', 'Registra un brindisi con gli amici', 25, 'facile', ARRAY['video'], '🥂', true),
(1, 'Selfie con maschera', 'Fai un selfie con una maschera o travestimento', 20, 'facile', ARRAY['foto'], '🎭', true),
(1, 'Foto di un tram', 'Scatta una foto di un tram o mezzo pubblico', 20, 'facile', ARRAY['foto'], '🚃', true),
(1, 'Video di un abbraccio', 'Registra un abbraccio tra amici', 20, 'facile', ARRAY['video'], '🤗', true),
(1, 'Selfie con bandiera', 'Fai un selfie con una bandiera', 20, 'facile', ARRAY['foto'], '🚩', true),
(1, 'Foto di un mercato', 'Scatta una foto di un mercato locale', 25, 'facile', ARRAY['foto'], '🛒', true),

-- MEDIE (30-50 punti)
(1, 'Video di una sfida', 'Registra una sfida divertente con gli amici', 35, 'media', ARRAY['video'], '🎯', true),
(1, 'Foto di un momento emozionante', 'Cattura un momento emozionante della giornata', 40, 'media', ARRAY['foto'], '❤️', true),
(1, 'Video di una canzone', 'Registra qualcuno che canta', 35, 'media', ARRAY['video'], '🎤', true),
(1, 'Selfie con vista panoramica', 'Fai un selfie con una vista panoramica', 40, 'media', ARRAY['foto'], '🏔️', true),
(1, 'Foto di un evento', 'Scatta una foto di un evento o festa', 35, 'media', ARRAY['foto'], '🎉', true),
(1, 'Video di una performance', 'Registra una performance (magia, giocoleria...)', 40, 'media', ARRAY['video'], '🎪', true),
(1, 'Selfie con costume', 'Fai un selfie con un costume o travestimento completo', 35, 'media', ARRAY['foto'], '🎨', true),
(1, 'Foto di un tramonto speciale', 'Cattura un tramonto con elementi particolari', 40, 'media', ARRAY['foto'], '🌇', true),
(1, 'Video di una storia', 'Racconta una storia divertente in video', 35, 'media', ARRAY['video'], '📖', true),
(1, 'Selfie con arte di strada', 'Fai un selfie con street art o murales', 40, 'media', ARRAY['foto'], '🎨', true),
(1, 'Foto di un momento spontaneo', 'Cattura un momento spontaneo e genuino', 35, 'media', ARRAY['foto'], '📸', true),
(1, 'Video di una reazione', 'Registra una reazione sorpresa o divertente', 35, 'media', ARRAY['video'], '😲', true),
(1, 'Selfie con sport', 'Fai un selfie durante un attività sportiva', 40, 'media', ARRAY['foto'], '⚽', true),
(1, 'Foto di un dettaglio artistico', 'Scatta una foto di un dettaglio artistico interessante', 35, 'media', ARRAY['foto'], '🖼️', true),
(1, 'Video di un gioco', 'Registra un gioco o competizione', 40, 'media', ARRAY['video'], '🎮', true),
(1, 'Selfie con natura', 'Fai un selfie immerso nella natura', 35, 'media', ARRAY['foto'], '🌳', true),
(1, 'Foto di un momento magico', 'Cattura un momento che sembra magico', 40, 'media', ARRAY['foto'], '✨', true),
(1, 'Video di una collaborazione', 'Registra una collaborazione creativa', 35, 'media', ARRAY['video'], '🤝', true),
(1, 'Selfie con architettura', 'Fai un selfie con un edificio architettonicamente interessante', 40, 'media', ARRAY['foto'], '🏗️', true),
(1, 'Foto di un contrasto', 'Scatta una foto che mostra un contrasto interessante', 35, 'media', ARRAY['foto'], '⚖️', true),

-- DIFFICILI (50-80 punti)
(1, 'Video di una coreografia', 'Crea e registra una coreografia di gruppo', 60, 'difficile', ARRAY['video'], '💃', true),
(1, 'Foto di una composizione artistica', 'Crea una composizione fotografica artistica', 65, 'difficile', ARRAY['foto'], '🎨', true),
(1, 'Video di una storia completa', 'Racconta una storia completa e coinvolgente', 60, 'difficile', ARRAY['video'], '📚', true),
(1, 'Selfie con location iconica', 'Fai un selfie in una location iconica o famosa', 70, 'difficile', ARRAY['foto'], '🗺️', true),
(1, 'Foto di un momento raro', 'Cattura un momento raro o unico', 65, 'difficile', ARRAY['foto'], '🔍', true),
(1, 'Video di una performance completa', 'Registra una performance completa e professionale', 70, 'difficile', ARRAY['video'], '🎭', true),
(1, 'Selfie con elemento unico', 'Fai un selfie con qualcosa di unico e particolare', 60, 'difficile', ARRAY['foto'], '💎', true),
(1, 'Foto di una serie tematica', 'Crea una serie di foto con un tema specifico', 65, 'difficile', ARRAY['foto'], '📷', true),
(1, 'Video di una sfida complessa', 'Completa e registra una sfida complessa', 70, 'difficile', ARRAY['video'], '🏆', true),
(1, 'Selfie con timing perfetto', 'Fai un selfie con un timing perfetto', 60, 'difficile', ARRAY['foto'], '⏰', true),
(1, 'Foto di un concetto astratto', 'Rappresenta un concetto astratto in una foto', 65, 'difficile', ARRAY['foto'], '🧠', true),
(1, 'Video di una trasformazione', 'Registra una trasformazione o cambiamento', 60, 'difficile', ARRAY['video'], '🦋', true),
(1, 'Selfie con prospettiva unica', 'Fai un selfie con una prospettiva unica', 70, 'difficile', ARRAY['foto'], '🔭', true),
(1, 'Foto di un momento storico', 'Cattura un momento che sembra storico', 65, 'difficile', ARRAY['foto'], '📜', true),
(1, 'Video di una creazione', 'Registra il processo di creazione di qualcosa', 60, 'difficile', ARRAY['video'], '🔨', true),
(1, 'Selfie con elemento culturale', 'Fai un selfie che rappresenta la cultura locale', 70, 'difficile', ARRAY['foto'], '🌍', true),
(1, 'Foto di un contrasto estremo', 'Crea una foto con un contrasto estremo', 65, 'difficile', ARRAY['foto'], '⚡', true),
(1, 'Video di una narrazione', 'Crea una narrazione video completa', 60, 'difficile', ARRAY['video'], '🎬', true),
(1, 'Selfie con elemento naturale raro', 'Fai un selfie con un elemento naturale raro', 70, 'difficile', ARRAY['foto'], '🌿', true),
(1, 'Foto di un momento epico', 'Cattura un momento che sembra epico', 65, 'difficile', ARRAY['foto'], '⚔️', true),

-- EPICHE (80-150 punti)
(1, 'Video di una produzione completa', 'Crea una produzione video completa e professionale', 100, 'epica', ARRAY['video'], '🎬', true),
(1, 'Foto di una serie documentaristica', 'Crea una serie documentaristica fotografica', 120, 'epica', ARRAY['foto'], '📸', true),
(1, 'Video di una performance epica', 'Registra una performance epica e memorabile', 110, 'epica', ARRAY['video'], '🌟', true),
(1, 'Selfie con location leggendaria', 'Fai un selfie in una location leggendaria', 100, 'epica', ARRAY['foto'], '🏰', true),
(1, 'Foto di un momento irripetibile', 'Cattura un momento che non si ripeterà mai', 120, 'epica', ARRAY['foto'], '💫', true),
(1, 'Video di una storia epica', 'Racconta una storia epica e coinvolgente', 110, 'epica', ARRAY['video'], '📖', true),
(1, 'Selfie con elemento mitico', 'Fai un selfie con qualcosa di mitico o leggendario', 100, 'epica', ARRAY['foto'], '🐉', true),
(1, 'Foto di una composizione epica', 'Crea una composizione fotografica epica', 120, 'epica', ARRAY['foto'], '🎨', true),
(1, 'Video di una creazione epica', 'Registra la creazione di qualcosa di epico', 110, 'epica', ARRAY['video'], '🏗️', true),
(1, 'Selfie con momento storico', 'Fai un selfie in un momento storico', 100, 'epica', ARRAY['foto'], '📅', true),
(1, 'Foto di un capolavoro', 'Crea un capolavoro fotografico', 120, 'epica', ARRAY['foto'], '👑', true),
(1, 'Video di una produzione cinematografica', 'Crea una produzione video cinematografica', 110, 'epica', ARRAY['video'], '🎥', true),
(1, 'Selfie con elemento unico al mondo', 'Fai un selfie con qualcosa di unico al mondo', 100, 'epica', ARRAY['foto'], '🌎', true),
(1, 'Foto di un momento leggendario', 'Cattura un momento che diventerà leggendario', 120, 'epica', ARRAY['foto'], '🏆', true),
(1, 'Video di una performance leggendaria', 'Registra una performance che diventerà leggendaria', 110, 'epica', ARRAY['video'], '⭐', true),
(1, 'Selfie con elemento iconico', 'Fai un selfie con qualcosa di iconico e riconoscibile', 100, 'epica', ARRAY['foto'], '🎯', true),
(1, 'Foto di un momento epico', 'Cattura il momento più epico possibile', 120, 'epica', ARRAY['foto'], '💥', true),
(1, 'Video di una creazione leggendaria', 'Registra la creazione di qualcosa di leggendario', 110, 'epica', ARRAY['video'], '🔮', true),
(1, 'Selfie con momento irripetibile', 'Fai un selfie in un momento che non si ripeterà', 100, 'epica', ARRAY['foto'], '⏳', true),
(1, 'Foto di un capolavoro assoluto', 'Crea il capolavoro fotografico definitivo', 150, 'epica', ARRAY['foto'], '👑', true),

-- ALTRE QUEST (per varietà)
(1, 'Video di una reazione estrema', 'Registra la reazione più estrema possibile', 45, 'media', ARRAY['video'], '😱', true),
(1, 'Foto di un momento di gioia', 'Cattura un momento di pura gioia', 30, 'facile', ARRAY['foto'], '😊', true),
(1, 'Selfie con elemento colorato', 'Fai un selfie con qualcosa di molto colorato', 25, 'facile', ARRAY['foto'], '🌈', true),
(1, 'Video di una canzone improvvisata', 'Canta una canzone improvvisata', 40, 'media', ARRAY['video'], '🎵', true),
(1, 'Foto di un dettaglio nascosto', 'Scatta una foto di un dettaglio che normalmente passa inosservato', 35, 'media', ARRAY['foto'], '🔍', true),
(1, 'Selfie con elemento vintage', 'Fai un selfie con qualcosa di vintage', 30, 'facile', ARRAY['foto'], '📻', true),
(1, 'Video di una risata contagiosa', 'Registra una risata così contagiosa da far ridere tutti', 25, 'facile', ARRAY['video'], '🤣', true),
(1, 'Foto di un momento di pace', 'Cattura un momento di pace e tranquillità', 30, 'facile', ARRAY['foto'], '☮️', true),
(1, 'Selfie con elemento tecnologico', 'Fai un selfie con qualcosa di tecnologico', 25, 'facile', ARRAY['foto'], '📱', true),
(1, 'Video di una danza spontanea', 'Registra una danza completamente spontanea', 35, 'media', ARRAY['video'], '🕺', true),
(1, 'Foto di un momento di amicizia', 'Cattura un momento che rappresenta l''amicizia', 30, 'facile', ARRAY['foto'], '🤝', true),
(1, 'Selfie con elemento naturale', 'Fai un selfie immerso nella natura', 25, 'facile', ARRAY['foto'], '🌲', true),
(1, 'Video di una collaborazione spontanea', 'Registra una collaborazione nata spontaneamente', 40, 'media', ARRAY['video'], '🤝', true),
(1, 'Foto di un momento di condivisione', 'Cattura un momento di condivisione', 30, 'facile', ARRAY['foto'], '💝', true),
(1, 'Selfie con elemento musicale', 'Fai un selfie con qualcosa legato alla musica', 25, 'facile', ARRAY['foto'], '🎸', true),
(1, 'Video di una performance improvvisata', 'Registra una performance completamente improvvisata', 45, 'media', ARRAY['video'], '🎭', true),
(1, 'Foto di un momento di scoperta', 'Cattura un momento di scoperta', 35, 'media', ARRAY['foto'], '🔎', true),
(1, 'Selfie con elemento artistico', 'Fai un selfie con qualcosa di artistico', 30, 'facile', ARRAY['foto'], '🎨', true),
(1, 'Video di una storia divertente', 'Racconta una storia divertente in video', 40, 'media', ARRAY['video'], '😄', true),
(1, 'Foto di un momento di unione', 'Cattura un momento che unisce le persone', 30, 'facile', ARRAY['foto'], '💞', true);

-- Nota: Le quest sono state create con giorno=1, ma possono essere usate per qualsiasi giorno
-- Il sistema di assegnazione casuale le distribuirà agli utenti

