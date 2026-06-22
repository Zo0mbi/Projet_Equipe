# DockerContainer - Guide de lancement rapide

## Objectif
Ce dossier lance l'environnement local du projet avec Docker Compose:
- un conteneur MySQL
- un conteneur API FastAPI
- un conteneur Cloudflared 

## Prerequis
- Docker Desktop (ou Docker Engine + plugin Compose) installe
- Sur Winows: Vous pouvez utilisez VSCode avec le plugin pour Docker. (Utiliez le terminal de VSCode)
- Verification rapide:

```bash
docker --version
docker compose version
```

## Structure importante
- `docker-compose.yml`
- `api/local.env` (variables de l'API)
- `mysql/local.env` (variables MySQL)
- `api/prod.env`, `mysql/prod.env` et `.env` pour la production

## Configuration des variables d'environnement

Par defaut, `docker-compose.yml` utilise:
- `./api/local.env`
- `./mysql/local.env`

Ces fichiers existent deja dans le projet pour le mode local.

### API (`api/local.env`)

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

### MySQL (`mysql/local.env`)

```env
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=...
MYSQL_USER=...
MYSQL_PASSWORD=...
```

## Lancer le projet

Depuis ce dossier (`DockerContainer`):

```bash
docker compose up --build
```

Version en arriere-plan:

```bash
docker compose up -d --build
```

## Arreter le projet

```bash
docker compose down
```

Supprimer aussi les volumes (reset de la base locale):

```bash
docker compose down -v
```

## Verifications utiles

Voir les conteneurs actifs:

```bash
docker ps
```

Voir les logs de tous les services:

```bash
docker compose logs -f
```

Voir les logs d'un seul service:

```bash
docker compose logs -f api
docker compose logs -f mysql
```

Entrer dans le conteneur API:

```bash
docker compose exec api sh
```

Entrer dans le conteneur MySQL:

```bash
docker compose exec mysql sh
```

## Ports exposes
- API: `http://localhost:8000`
- MySQL: `127.0.0.1:${MYSQL_PORT:-3306}` -> port interne `3306`

## Utiliser les fichiers production (optionnel)

Pour demarrer avec les variables de production:

```bash
API_ENV_FILE=./api/prod.env MYSQL_ENV_FILE=./mysql/prod.env docker compose up --build
```

## Depannage rapide
- Le service API ne demarre pas:
	- verifier que `mysql` est en etat `healthy` avec `docker compose ps`
	- verifier les variables DB dans `api/local.env`
- Port 3306 deja utilise:
	- changer `MYSQL_PORT` dans votre shell (ex: `MYSQL_PORT=3307`)
- Changement SQL non pris en compte:
	- relancer avec `docker compose down -v` puis `docker compose up --build`

