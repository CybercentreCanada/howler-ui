# Howler UI

## Development

```bash
git clone git@github.com:CybercentreCanada/howler-ui.git
cd howler-ui
yarn install
yarn start
```

### API Mode

You can control the API mode with the `REACT_APP_API` environment variable.

You should set this variable by creating a `.env.development.local` file located at the root of the repository.

#### REST `default`

```
REACT_APP_API=REST
```

This will direct all HTTP request to `http://localhost:5000`

#### MOCK

```
REACT_APP_API=MOCK
```

This will direct all HTTP request to `http://localhost:5000`
