const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const TARGET_BASE_URL = 'https://api.apigateway.cl';

app.all('*', async (req, res) => {
  try {
    // Reconstruir la URL de destino final en API Gateway
    const targetUrl = `${TARGET_BASE_URL}${req.originalUrl}`;
    
    // Clonar las cabeceras originales omitiendo host para no romper la firma SSL
    const headers = { ...req.headers };
    delete headers.host;

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error en Micro Proxy', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy activo en puerto ${PORT}`));
