import './style.css'

interface KeyState {
  scancode: number
  value: number
  name: string
  lastUpdated: number
}

class AnalogSenseTestApp {
  private device: AnalogDevice | null = null
  private keyStates: Map<number, KeyState> = new Map()
  private isListening = false

  constructor() {
    this.render()
    this.setupEventListeners()
    this.checkExistingDevices()
  }

  private render(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.innerHTML = `
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
    `
  }

  private setupEventListeners(): void {
    document.getElementById('request-device')!.addEventListener('click', () => this.requestDevice())
    document.getElementById('get-devices')!.addEventListener('click', () => this.getDevices())
    document.getElementById('start-listening')!.addEventListener('click', () => this.startListening())
    document.getElementById('stop-listening')!.addEventListener('click', () => this.stopListening())
    document.getElementById('test-scancode')!.addEventListener('click', () => this.testScancodeToString())
    document.getElementById('show-device-details')!.addEventListener('click', () => this.showDeviceDetails())
    document.getElementById('forget-device')!.addEventListener('click', () => this.forgetDevice())
  }

  private async checkExistingDevices(): Promise<void> {
    try {
      const devices = await analogsense.getDevices()
      if (devices.length > 0) {
        this.updateDeviceInfo(`${devices.length}個の既存デバイスが見つかりました`)
        this.device = devices[0]
        this.onDeviceConnected()
      }
    } catch (error) {
      console.log('既存デバイスの確認中にエラー:', error)
    }
  }

  private async requestDevice(): Promise<void> {
    try {
      this.updateDeviceInfo('デバイスを選択してください...')
      const device = await analogsense.requestDevice()
      if (device) {
        this.device = device
        this.onDeviceConnected()
      } else {
        this.updateDeviceInfo('デバイスが選択されませんでした')
      }
    } catch (error) {
      this.updateDeviceInfo(`エラー: ${error}`)
    }
  }

  private async getDevices(): Promise<void> {
    try {
      const devices = await analogsense.getDevices()
      if (devices.length === 0) {
        this.updateDeviceInfo('接続されているデバイスがありません。「デバイスを選択」を使用してください。')
      } else {
        const deviceList = devices.map(d => d.getProductName()).join(', ')
        this.updateDeviceInfo(`見つかったデバイス: ${deviceList}`)
        this.device = devices[0]
        this.onDeviceConnected()
      }
    } catch (error) {
      this.updateDeviceInfo(`エラー: ${error}`)
    }
  }

  private onDeviceConnected(): void {
    if (!this.device) return
    const name = this.device.getProductName()
    this.updateDeviceInfo(`接続済み: ${name}`)
    this.updateStatus('接続済み - リスニング待機中')

    document.getElementById('start-listening')!.removeAttribute('disabled')
    document.getElementById('forget-device')!.removeAttribute('disabled')
  }

  private startListening(): void {
    if (!this.device || this.isListening) return

    this.device.startListening((activeKeys) => {
      this.handleKeyEvents(activeKeys)
    })
    this.isListening = true
    this.updateStatus('リスニング中...')

    document.getElementById('start-listening')!.setAttribute('disabled', '')
    document.getElementById('stop-listening')!.removeAttribute('disabled')
  }

  private stopListening(): void {
    if (!this.device || !this.isListening) return

    this.device.stopListening()
    this.isListening = false
    this.updateStatus('リスニング停止')

    document.getElementById('start-listening')!.removeAttribute('disabled')
    document.getElementById('stop-listening')!.setAttribute('disabled', '')
  }

  private handleKeyEvents(activeKeys: AnalogKeyEvent[]): void {
    const now = Date.now()
    const activeScancodes = new Set(activeKeys.map(k => k.scancode))

    // アクティブなキーを更新
    for (const key of activeKeys) {
      const keyName = analogsense.scancodeToString(key.scancode)
      this.keyStates.set(key.scancode, {
        scancode: key.scancode,
        value: key.value,
        name: keyName,
        lastUpdated: now
      })
    }

    // 離されたキーを削除（アクティブリストにないキー）
    for (const [scancode] of this.keyStates) {
      if (!activeScancodes.has(scancode)) {
        this.keyStates.delete(scancode)
      }
    }

    this.updateVisualization()
    if (activeKeys.length > 0) {
      this.updateRawData(activeKeys)
    }
  }

  private updateVisualization(): void {
    const container = document.getElementById('key-visualization')!
    const sortedKeys = Array.from(this.keyStates.values())
      .filter(k => k.value > 0)
      .sort((a, b) => b.value - a.value)

    if (sortedKeys.length === 0) {
      container.innerHTML = '<p class="placeholder">キーを押してください</p>'
      return
    }

    container.innerHTML = sortedKeys.map(key => `
      <div class="key-card" style="--intensity: ${key.value}">
        <div class="key-name">${key.name}</div>
        <div class="key-value">${(key.value * 100).toFixed(1)}%</div>
        <div class="key-bar">
          <div class="key-bar-fill" style="width: ${key.value * 100}%"></div>
        </div>
        <div class="key-scancode">0x${key.scancode.toString(16).toUpperCase().padStart(2, '0')}</div>
      </div>
    `).join('')
  }

  private updateRawData(events: AnalogKeyEvent[]): void {
    const container = document.getElementById('raw-data')!
    const timestamp = new Date().toISOString()

    const eventHtml = events.map(e => {
      const name = analogsense.scancodeToString(e.scancode)
      return `<div class="raw-event">
        <span class="timestamp">${timestamp}</span>
        <span class="key">${name}</span>
        <span class="scancode">0x${e.scancode.toString(16).toUpperCase().padStart(2, '0')}</span>
        <span class="value">${e.value.toFixed(4)}</span>
      </div>`
    }).join('')

    container.innerHTML = eventHtml + container.innerHTML
    // 最大100件に制限
    const children = container.children
    while (children.length > 100) {
      container.removeChild(children[children.length - 1])
    }
  }

  private testScancodeToString(): void {
    const input = document.getElementById('scancode-input') as HTMLInputElement
    const result = document.getElementById('scancode-result')!
    const scancode = parseInt(input.value, 10)

    if (isNaN(scancode)) {
      result.textContent = 'エラー: 有効な数値を入力してください'
      return
    }

    try {
      const name = analogsense.scancodeToString(scancode)
      result.innerHTML = `
        <strong>入力:</strong> ${scancode} (0x${scancode.toString(16).toUpperCase()})<br>
        <strong>結果:</strong> "${name}"
      `
    } catch (error) {
      result.textContent = `エラー: ${error}`
    }
  }

  private showDeviceDetails(): void {
    const result = document.getElementById('device-details')!

    if (!this.device) {
      result.textContent = 'デバイスが接続されていません'
      return
    }

    const hidDevice = this.device.dev
    result.innerHTML = `
      <strong>製品名:</strong> ${this.device.getProductName()}<br>
      <strong>Vendor ID:</strong> 0x${hidDevice.vendorId.toString(16).toUpperCase().padStart(4, '0')}<br>
      <strong>Product ID:</strong> 0x${hidDevice.productId.toString(16).toUpperCase().padStart(4, '0')}<br>
      <strong>開いている:</strong> ${hidDevice.opened ? 'はい' : 'いいえ'}
    `
  }

  private async forgetDevice(): Promise<void> {
    const result = document.getElementById('forget-result')!

    if (!this.device) {
      result.textContent = 'デバイスが接続されていません'
      return
    }

    try {
      if (this.isListening) {
        this.stopListening()
      }
      this.device.forget()
      result.textContent = 'デバイスを切断しました'
      this.device = null
      this.keyStates.clear()
      this.updateDeviceInfo('未接続')
      this.updateStatus('未接続')
      this.updateVisualization()

      document.getElementById('start-listening')!.setAttribute('disabled', '')
      document.getElementById('stop-listening')!.setAttribute('disabled', '')
      document.getElementById('forget-device')!.setAttribute('disabled', '')
    } catch (error) {
      result.textContent = `エラー: ${error}`
    }
  }

  private updateDeviceInfo(message: string): void {
    document.getElementById('device-info')!.textContent = message
  }

  private updateStatus(status: string): void {
    document.getElementById('listening-status')!.textContent = status
  }
}

new AnalogSenseTestApp()
