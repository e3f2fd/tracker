// index.js
import app from './app.js';
import { PORT } from './config.js';

app.listen(PORT, () => {
	console.log(`Server started on http://localhost:${PORT}`);
});
