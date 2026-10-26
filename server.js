// cPanel Phusion Passenger & Production Entrypoint
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// CRITICAL FOR CPANEL / PASSENGER:
// process.env.PORT in Phusion Passenger is often a Unix socket string (e.g. /tmp/passenger.xxx.sock)
// or a dynamic TCP port. NEVER use parseInt() here!
const port = process.env.PORT || 3000;

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, (err) => {
      if (err) {
        console.error('Server listen error:', err);
        process.exit(1);
      }
      console.log(`> Fassi7 Academy listening on: ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  });
