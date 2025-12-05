declare global {
  interface AnalogKeyEvent {
    scancode: number
    value: number
  }

  interface AnalogDevice {
    startListening(handler: (events: AnalogKeyEvent[]) => void): void
    stopListening(): void
    getProductName(): string
    forget(): void
    dev: HIDDevice
  }

  interface AnalogSense {
    getDevices(): Promise<AnalogDevice[]>
    requestDevice(): Promise<AnalogDevice | undefined>
    scancodeToString(scancode: number): string
  }

  const analogsense: AnalogSense
}

export {}
