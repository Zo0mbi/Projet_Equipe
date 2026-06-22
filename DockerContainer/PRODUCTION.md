# Pour le déploiement

- Mise en place de Cloudflare Tunnel par le docker-compose.yml
1. Aller sur Cloudflare et créer vous un nouveau tunnel
2. Assigner lui un nom de domain.
3. Créer une route. Assurez vous qu'elle pointe sur votre conteneur docker pour votre API pour limiter sa portée.
```
  cloudflared:
    image: cloudflare/cloudflared:latest   
    env_file:
      - .env
    command: tunnel run --token ${TUNNEL_TOKEN}
    restart: unless-stopped
    networks:
      - internal
```
- Ajouter votre TUNNEL_TOKEN dans la variable d'environnement situer dans le .env à la racine de /DockerContainer

1. Vous pouvez maintenant lancer le docker compose pour lancer les environnements nécéssaires au backend.

