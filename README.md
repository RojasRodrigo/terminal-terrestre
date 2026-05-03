# Terminal Terrestre — Sistema de Gestión

Aplicación web para la gestión operativa de una terminal terrestre, implementando estructuras de datos avanzadas y algoritmos de optimización.

## Stack tecnológico

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | React 18 + TypeScript + Vite        |
| Backend    | Node.js + Express + TypeScript      |
| Base datos | PostgreSQL 16                       |
| Contenedores | Docker + Docker Compose           |
| Tiempo real | WebSockets (ws)                   |
| Estado     | Zustand + React Query               |
| Grafo      | Cytoscape.js                        |

## Estructura del proyecto

```
terminal-terrestre/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── database/
│   └── migrations/
│       └── 001_init.sql          ← esquema + datos semilla
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              ← entrypoint HTTP + WS
│       ├── models/types.ts       ← interfaces TypeScript
│       ├── utils/
│       │   ├── db.ts             ← pool PostgreSQL
│       │   └── websocket.ts      ← broadcast WS
│       ├── services/
│       │   ├── dijkstra.service.ts  ← grafo + min-heap + algoritmo
│       │   └── cola.service.ts      ← cola de prioridad
│       ├── controllers/
│       │   ├── rutas.controller.ts
│       │   └── despachos.controller.ts
│       └── routes/index.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx               ← router + layout sidebar
        ├── types/index.ts
        ├── store/index.ts        ← Zustand global store
        ├── hooks/useWebSocket.ts ← reconexión automática
        ├── services/api.ts       ← axios client
        └── pages/
            ├── Dashboard.tsx     ← métricas + cola resumida
            ├── Rutas.tsx         ← Dijkstra + log pasos WS
            └── Despachos.tsx     ← cola de prioridad CRUD
```

## Arrancar el proyecto

```bash
# 1. Clonar / descomprimir el proyecto
cd terminal-terrestre

# 2. Levantar todos los servicios
docker-compose up --build

# 3. Acceder
#    Web:  http://localhost:5173
#    DB:   localhost:8080
```

## Endpoints de la API

### Red de transporte (Grafo)
| Método | Ruta              | Descripción                          |
|--------|-------------------|--------------------------------------|
| GET    | /api/ciudades     | Lista de ciudades (nodos)            |
| POST   | /api/ciudades     | Crear ciudad                         |
| GET    | /api/rutas        | Lista de rutas (aristas)             |
| POST   | /api/rutas        | Crear ruta                           |
| GET    | /api/grafo        | Lista de adyacencia completa         |
| POST   | /api/trayecto     | Calcular ruta óptima con Dijkstra    |

### Buses y despachos (Cola de prioridad)
| Método | Ruta                       | Descripción               |
|--------|----------------------------|---------------------------|
| GET    | /api/buses                 | Lista de buses            |
| GET    | /api/despachos/cola        | Cola ordenada por prioridad |
| GET    | /api/despachos/historial   | Despachos completados     |
| POST   | /api/despachos             | Crear despacho            |
| PATCH  | /api/despachos/:id/estado  | Actualizar estado         |

### WebSocket
Conectar a `ws://localhost:4000/ws`

Eventos recibidos:
- `dijkstra_paso` — cada paso del algoritmo en tiempo real
- `despacho_nuevo` — nuevo despacho creado
- `despacho_update` — estado actualizado
- `cola_update` — cola completa reordenada

## Algoritmos implementados

### Dijkstra (OE1)
- Grafo modelado como lista de adyacencia en PostgreSQL
- Min-Heap propio en TypeScript (O(log n) por operación)
- Complejidad total: O((V + E) log V)
- Soporta optimización por distancia o duración
- Pasos transmitidos por WebSocket para visualización en tiempo real

### Cola de prioridad (OE2)
- Prioridad efectiva = urgencia + prioridad_base + tiempo_restante
- Urgencias: normal / alta / crítica con pesos 0 / 10 / 20
- Ordenamiento en PostgreSQL con índices sobre estado y hora
- Actualización en tiempo real vía WebSocket broadcast


