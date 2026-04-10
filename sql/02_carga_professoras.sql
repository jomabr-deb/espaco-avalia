-- ═══════════════════════════════════════
-- CARGA INICIAL: PROFESSORAS (14 registros)
-- ═══════════════════════════════════════

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Bettina Zipperer', '015.985.619-10', '2022-02-01', 'bercario@escolaespacodacrianca.com.br', 'HBTRQJ', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Camila Cristina Pepplow', '064.930.819-04', '2022-01-10', 'infantil2a@escolaespacodacrianca.com.br', 'GF5CBF', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Camila Dunayski', '085.274.709-85', '2022-01-10', 'infantil1b@escolaespacodacrianca.com.br', 'PQBN4Q', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Carina Danieli Dos Santos', '110.012.209-51', '2024-09-23', 'ingles@escolaespacodacrianca.com.br', '6TAL5X', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Daniella Fagundes de Souza', '036.321.919-64', '2025-01-16', NULL, NULL, true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Esthefane Larissa Machado Cordeiro', '144.409.259-60', '2023-02-01', 'infantil1@escolaespacodacrianca.com.br', 'TKPXGF', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Joyce Alexandra Guerra', '032.518.829-70', '2025-01-20', 'infantil5b@escolaespacodacrianca.com.br', '2GYYSC', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Julia Eduarda Ortiz de Araujo', '117.801.539-45', '2022-02-01', 'infantil4a@escolaespacodacrianca.com.br', '7H2FUZ', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Karina Fortes Hekave', '094.635.899-02', '2026-02-02', 'infantil2b@escolaespacodacrianca.com.br', 'NECQUF', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Kely Regina Pontes', '062.748.939-70', '2024-01-15', 'infantil5@escolaespacodacrianca.com.br', 'QG2T7Z', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Leiridiane Mecca Teixeira', '079.840.319-59', '2022-01-10', NULL, NULL, true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Lyllian Marinho De Moura Martins', '105.261.484-11', '2025-01-15', 'infantil4b@escolaespacodacrianca.com.br', 'LZYPTE', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Maria Cristina Padilha', '125.482.939-39', '2023-03-20', 'infantil3b@escolaespacodacrianca.com.br', 'LRL72T', true);

INSERT INTO teachers (nome, cpf, data_admissao, email, access_code, ativo)
VALUES ('Melissa de Cassia Pepplow', '077.776.799-61', '2022-01-10', 'infantil3a@escolaespacodacrianca.com.br', 'QWDQCW', true);


-- ═══════════════════════════════════════
-- ATRIBUIÇÃO DE TURMAS (ano letivo 2026)
-- ═══════════════════════════════════════

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Berçário', NULL, 2026, id FROM teachers WHERE cpf = '015.985.619-10';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 2', 'A', 2026, id FROM teachers WHERE cpf = '064.930.819-04';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 1', 'B', 2026, id FROM teachers WHERE cpf = '085.274.709-85';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 1', 'A', 2026, id FROM teachers WHERE cpf = '144.409.259-60';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 5', 'B', 2026, id FROM teachers WHERE cpf = '032.518.829-70';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 4', 'A', 2026, id FROM teachers WHERE cpf = '117.801.539-45';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 2', 'B', 2026, id FROM teachers WHERE cpf = '094.635.899-02';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 5', 'A', 2026, id FROM teachers WHERE cpf = '062.748.939-70';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 4', 'B', 2026, id FROM teachers WHERE cpf = '105.261.484-11';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 3', 'B', 2026, id FROM teachers WHERE cpf = '125.482.939-39';

INSERT INTO turmas (serie, subturma, ano_letivo, teacher_id)
SELECT 'Infantil 3', 'A', 2026, id FROM teachers WHERE cpf = '077.776.799-61';


-- ═══════════════════════════════════════
-- PRAZO INICIAL
-- ═══════════════════════════════════════

INSERT INTO deadlines (ano, semestre, data_limite, ativo, permitir_atraso)
VALUES (2026, 1, '2026-06-30', true, false);

-- ═══════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════

-- Após executar, verifique:
-- SELECT nome, access_code, email FROM teachers WHERE access_code IS NOT NULL ORDER BY nome;
-- SELECT t.serie, t.subturma, p.nome FROM turmas t JOIN teachers p ON t.teacher_id = p.id ORDER BY t.serie;
