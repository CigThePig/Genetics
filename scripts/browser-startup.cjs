// Bounded readiness wait: CI can insert ANSI styles between "Local" and ":".
function waitForVite(server, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const ansi = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.stdout.off('data', onData);
      server.off('error', onError);
      server.off('exit', onExit);
      if (error) {
        server.kill();
        reject(error);
      } else resolve();
    };
    const onData = (data) => {
      if (data.toString().replace(ansi, '').includes('Local:')) finish();
    };
    const onError = (error) => finish(error);
    const onExit = (code) => finish(new Error('Vite exited ' + code));
    const timer = setTimeout(() => finish(new Error('Vite startup timed out')), timeoutMs);
    server.stdout.on('data', onData);
    server.on('error', onError);
    server.on('exit', onExit);
  });
}
module.exports = { waitForVite };
