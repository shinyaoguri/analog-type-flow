(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const n of e)if(n.type==="childList")for(const d of n.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&i(d)}).observe(document,{childList:!0,subtree:!0});function s(e){const n={};return e.integrity&&(n.integrity=e.integrity),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?n.credentials="include":e.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(e){if(e.ep)return;e.ep=!0;const n=s(e);fetch(e.href,n)}})();class c{device=null;keyStates=new Map;isListening=!1;constructor(){this.render(),this.setupEventListeners(),this.checkExistingDevices()}render(){const t=document.querySelector("#app");t.innerHTML=`
      <header>
        <h1>AnalogSense.js API Test</h1>
        <p class="subtitle">アナログキーボード入力の可視化デモ</p>
      </header>

      <main>
        <section class="connection-section">
          <h2>デバイス接続</h2>
          <div class="button-group">
            <button id="request-device" class="primary">デバイスを選択</button>
            <button id="get-devices">既存デバイスを取得</button>
          </div>
          <div id="device-info" class="device-info"></div>
        </section>

        <section class="listening-section">
          <h2>入力リスニング</h2>
          <div class="button-group">
            <button id="start-listening" disabled>リスニング開始</button>
            <button id="stop-listening" disabled>リスニング停止</button>
          </div>
          <div id="listening-status" class="status">未接続</div>
        </section>

        <section class="visualization-section">
          <h2>キー入力の可視化</h2>
          <div id="key-visualization" class="key-grid"></div>
        </section>

        <section class="raw-data-section">
          <h2>生データ</h2>
          <div id="raw-data" class="raw-data">
            <p class="placeholder">キーを押すとデータが表示されます</p>
          </div>
        </section>

        <section class="api-test-section">
          <h2>API テスト</h2>
          <div class="api-tests">
            <div class="api-test">
              <h3>scancodeToString()</h3>
              <div class="input-group">
                <input type="number" id="scancode-input" placeholder="スキャンコード (例: 4)" value="4" />
                <button id="test-scancode">変換</button>
              </div>
              <div id="scancode-result" class="result"></div>
            </div>
            <div class="api-test">
              <h3>デバイス情報</h3>
              <button id="show-device-details">詳細を表示</button>
              <div id="device-details" class="result"></div>
            </div>
            <div class="api-test">
              <h3>forget()</h3>
              <button id="forget-device" disabled>デバイスを切断</button>
              <div id="forget-result" class="result"></div>
            </div>
          </div>
        </section>

        <section class="scancode-reference">
          <h2>スキャンコード参照</h2>
          <div class="scancode-tables">
            <div class="scancode-table">
              <h3>標準キー (0x00-0xFF)</h3>
              <table>
                <thead><tr><th>コード</th><th>キー</th></tr></thead>
                <tbody>
                  <tr><td>0x04</td><td>A</td></tr>
                  <tr><td>0x05</td><td>B</td></tr>
                  <tr><td>0x06</td><td>C</td></tr>
                  <tr><td>0x1E</td><td>1</td></tr>
                  <tr><td>0x28</td><td>Enter</td></tr>
                  <tr><td>0x2C</td><td>Space</td></tr>
                </tbody>
              </table>
            </div>
            <div class="scancode-table">
              <h3>メディアキー (0x300-0x3FF)</h3>
              <table>
                <thead><tr><th>コード</th><th>キー</th></tr></thead>
                <tbody>
                  <tr><td>0x3B5</td><td>Next Track</td></tr>
                  <tr><td>0x3B6</td><td>Previous Track</td></tr>
                  <tr><td>0x3B7</td><td>Stop</td></tr>
                  <tr><td>0x3CD</td><td>Play/Pause</td></tr>
                </tbody>
              </table>
            </div>
            <div class="scancode-table">
              <h3>OEMキー (0x400-0x4FF)</h3>
              <table>
                <thead><tr><th>コード</th><th>機能</th></tr></thead>
                <tbody>
                  <tr><td>0x401</td><td>Brightness Down</td></tr>
                  <tr><td>0x402</td><td>Brightness Up</td></tr>
                  <tr><td>0x403-0x405</td><td>Profile 1-3</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>
          <a href="https://analogsense.org/JavaScript-SDK/" target="_blank" rel="noopener">AnalogSense.js Documentation</a>
          |
          <a href="https://github.com/AnalogSense/JavaScript-SDK" target="_blank" rel="noopener">GitHub</a>
        </p>
      </footer>
    `}setupEventListeners(){document.getElementById("request-device").addEventListener("click",()=>this.requestDevice()),document.getElementById("get-devices").addEventListener("click",()=>this.getDevices()),document.getElementById("start-listening").addEventListener("click",()=>this.startListening()),document.getElementById("stop-listening").addEventListener("click",()=>this.stopListening()),document.getElementById("test-scancode").addEventListener("click",()=>this.testScancodeToString()),document.getElementById("show-device-details").addEventListener("click",()=>this.showDeviceDetails()),document.getElementById("forget-device").addEventListener("click",()=>this.forgetDevice())}async checkExistingDevices(){try{const t=await analogsense.getDevices();t.length>0&&(this.updateDeviceInfo(`${t.length}個の既存デバイスが見つかりました`),this.device=t[0],this.onDeviceConnected())}catch(t){console.log("既存デバイスの確認中にエラー:",t)}}async requestDevice(){try{this.updateDeviceInfo("デバイスを選択してください...");const t=await analogsense.requestDevice();t?(this.device=t,this.onDeviceConnected()):this.updateDeviceInfo("デバイスが選択されませんでした")}catch(t){this.updateDeviceInfo(`エラー: ${t}`)}}async getDevices(){try{const t=await analogsense.getDevices();if(t.length===0)this.updateDeviceInfo("接続されているデバイスがありません。「デバイスを選択」を使用してください。");else{const s=t.map(i=>i.getProductName()).join(", ");this.updateDeviceInfo(`見つかったデバイス: ${s}`),this.device=t[0],this.onDeviceConnected()}}catch(t){this.updateDeviceInfo(`エラー: ${t}`)}}onDeviceConnected(){if(!this.device)return;const t=this.device.getProductName();this.updateDeviceInfo(`接続済み: ${t}`),this.updateStatus("接続済み - リスニング待機中"),document.getElementById("start-listening").removeAttribute("disabled"),document.getElementById("forget-device").removeAttribute("disabled")}startListening(){!this.device||this.isListening||(this.device.startListening(t=>{this.handleKeyEvents(t)}),this.isListening=!0,this.updateStatus("リスニング中..."),document.getElementById("start-listening").setAttribute("disabled",""),document.getElementById("stop-listening").removeAttribute("disabled"))}stopListening(){!this.device||!this.isListening||(this.device.stopListening(),this.isListening=!1,this.updateStatus("リスニング停止"),document.getElementById("start-listening").removeAttribute("disabled"),document.getElementById("stop-listening").setAttribute("disabled",""))}handleKeyEvents(t){const s=Date.now(),i=new Set(t.map(e=>e.scancode));for(const e of t){const n=analogsense.scancodeToString(e.scancode);this.keyStates.set(e.scancode,{scancode:e.scancode,value:e.value,name:n,lastUpdated:s})}for(const[e]of this.keyStates)i.has(e)||this.keyStates.delete(e);this.updateVisualization(),t.length>0&&this.updateRawData(t)}updateVisualization(){const t=document.getElementById("key-visualization"),s=Array.from(this.keyStates.values()).filter(i=>i.value>0).sort((i,e)=>e.value-i.value);if(s.length===0){t.innerHTML='<p class="placeholder">キーを押してください</p>';return}t.innerHTML=s.map(i=>`
      <div class="key-card" style="--intensity: ${i.value}">
        <div class="key-name">${i.name}</div>
        <div class="key-value">${(i.value*100).toFixed(1)}%</div>
        <div class="key-bar">
          <div class="key-bar-fill" style="width: ${i.value*100}%"></div>
        </div>
        <div class="key-scancode">0x${i.scancode.toString(16).toUpperCase().padStart(2,"0")}</div>
      </div>
    `).join("")}updateRawData(t){const s=document.getElementById("raw-data"),i=new Date().toISOString(),e=t.map(d=>{const o=analogsense.scancodeToString(d.scancode);return`<div class="raw-event">
        <span class="timestamp">${i}</span>
        <span class="key">${o}</span>
        <span class="scancode">0x${d.scancode.toString(16).toUpperCase().padStart(2,"0")}</span>
        <span class="value">${d.value.toFixed(4)}</span>
      </div>`}).join("");s.innerHTML=e+s.innerHTML;const n=s.children;for(;n.length>100;)s.removeChild(n[n.length-1])}testScancodeToString(){const t=document.getElementById("scancode-input"),s=document.getElementById("scancode-result"),i=parseInt(t.value,10);if(isNaN(i)){s.textContent="エラー: 有効な数値を入力してください";return}try{const e=analogsense.scancodeToString(i);s.innerHTML=`
        <strong>入力:</strong> ${i} (0x${i.toString(16).toUpperCase()})<br>
        <strong>結果:</strong> "${e}"
      `}catch(e){s.textContent=`エラー: ${e}`}}showDeviceDetails(){const t=document.getElementById("device-details");if(!this.device){t.textContent="デバイスが接続されていません";return}const s=this.device.dev;t.innerHTML=`
      <strong>製品名:</strong> ${this.device.getProductName()}<br>
      <strong>Vendor ID:</strong> 0x${s.vendorId.toString(16).toUpperCase().padStart(4,"0")}<br>
      <strong>Product ID:</strong> 0x${s.productId.toString(16).toUpperCase().padStart(4,"0")}<br>
      <strong>開いている:</strong> ${s.opened?"はい":"いいえ"}
    `}async forgetDevice(){const t=document.getElementById("forget-result");if(!this.device){t.textContent="デバイスが接続されていません";return}try{this.isListening&&this.stopListening(),this.device.forget(),t.textContent="デバイスを切断しました",this.device=null,this.keyStates.clear(),this.updateDeviceInfo("未接続"),this.updateStatus("未接続"),this.updateVisualization(),document.getElementById("start-listening").setAttribute("disabled",""),document.getElementById("stop-listening").setAttribute("disabled",""),document.getElementById("forget-device").setAttribute("disabled","")}catch(s){t.textContent=`エラー: ${s}`}}updateDeviceInfo(t){document.getElementById("device-info").textContent=t}updateStatus(t){document.getElementById("listening-status").textContent=t}}new c;
