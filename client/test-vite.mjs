import { preview } from 'vite';

async function testVite() {
  const server = await preview({
    root: '.',
    preview: { port: 4173 }
  });

  const address = server.httpServer.address();
  console.log('Listening on:', address);

  const routes = [
    '/',
    '/guidelines',
    '/submit',
    '/review',
    '/history'
  ];

  console.log('Testing routes:');
  let allPassed = true;
  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:4173${route}`);
      const text = await res.text();
      const hasRoot = text.includes('id="root"');
      const hasTitle = text.includes('Unifyra');
      if (res.status === 200 && hasRoot && hasTitle) {
        console.log(`[PASS] ${route} -> Status 200 (HTML verified, Unifyra root container present)`);
      } else {
        console.log(`[WARN] ${route} -> Status ${res.status}`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`[FAIL] ${route} -> ${err.message}`);
      allPassed = false;
    }
  }

  await new Promise((resolve) => server.httpServer.close(resolve));
  if (allPassed) {
    console.log('ALL ROUTES VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

testVite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
