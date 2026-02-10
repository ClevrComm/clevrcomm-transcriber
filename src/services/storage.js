import { openDB } from 'idb';

const DB_NAME = 'clevrcomm-db';
const STORE_NAME = 'sessions';

export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp');
            }
        },
    });
}

export async function saveSession(session) {
    const db = await initDB();
    await db.put(STORE_NAME, {
        ...session,
        timestamp: session.timestamp || Date.now()
    });
}

export async function getSessions() {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'timestamp');
}

export async function deleteSession(id) {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
}

export async function getSession(id) {
    const db = await initDB();
    return db.get(STORE_NAME, id);
}
