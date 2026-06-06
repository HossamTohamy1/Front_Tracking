import { useEffect, useState } from "react";

function App() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = () => {
    if (prompt) prompt.prompt();
  };

  return (
    <div>
      <h1>My PWA App</h1>
      {prompt && <button onClick={installApp}>Install App</button>}
    </div>
  );
}

export default App;