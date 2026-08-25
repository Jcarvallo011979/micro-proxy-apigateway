const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Se utiliza app.apigateway.cl que es el host estándar de API Gateway Chile
const TARGET_BASE_URL = 'https://app.apigateway.cl/api/v2';

app.get('/health', (req, res) => res.json({ status: 'ok', proxy: 'active' }));

app.all('*', async (req, res) => {
  try {
    const targetUrl = `${TARGET_BASE_URL}${req.originalUrl}`;
    
    // Clonar headers limpios
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    // Asegurar que el Host coincida con el servidor destino
    headers['Host'] = 'app.apigateway.cl';

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
