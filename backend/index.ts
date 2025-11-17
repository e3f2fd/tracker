// index.js
import app from './app.js';
import { PORT } from './config.js';
import { checkForUpdates, startPolling } from './services/pollerService.js';

app.listen(PORT, () => {
	console.log(`server started on http://localhost:${PORT}`);
});

startPolling();

checkForUpdates().catch(err => {
	console.error('inital poll failed', err);
});
