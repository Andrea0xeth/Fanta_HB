# admin-maintenance

Edge Function (service role) per operazioni di manutenzione Admin:

- cancellare uno o più utenti (profilo DB + Auth user se esiste)
- azzerare i punti personali di uno o più utenti
- pulire le prove quest inviate (in verifica oppure tutte) e resettare `user_quest_assignments.completed_at`
- cancellare le gare completate e fare rollback dei punti squadra assegnati

## Deploy

```bash
supabase functions deploy admin-maintenance
```


