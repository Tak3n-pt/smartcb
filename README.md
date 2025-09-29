# SmartCB - Smart Circuit Breaker App

## 🔌 Overview
SmartCB is a mobile application for monitoring and controlling an ESP32-based smart circuit breaker system.

## 📱 Features
- **Real-time Monitoring**: Voltage, Current, Power, Energy, Frequency, Power Factor
- **Remote Control**: Turn circuit breaker ON/OFF from your phone
- **Protection Settings**: Configure voltage, current, and other thresholds
- **Event Logging**: Complete history of all events and power outages
- **Dark/Light Mode**: Beautiful UI that works in any lighting condition

## 📸 Screenshots

### Home Screen (Dashboard)
- Real-time electrical readings
- Large ON/OFF toggle control
- Connection status indicator

### Settings Screen
- Voltage protection limits (200V - 240V)
- Current protection limits (0 - 16A)
- Energy consumption limits
- Frequency protection (49.5Hz - 50.5Hz)
- Power factor monitoring

### Events Screen
- Complete event history
- Filter by date and type
- Monthly statistics

## 🎯 Current Status
**Phase 1 Complete**: UI Design with Mock Data
- ✅ All screens designed and functional
- ✅ Mock data simulating real electrical readings
- ✅ Dark mode support
- ✅ Responsive design

## 🔧 Technical Details
- **Framework**: React Native + Expo
- **State Management**: Zustand
- **UI Components**: Custom components with React Native SVG
- **Language**: TypeScript

## 📝 Hardware Requirements (Future)
- ESP32 Microcontroller
- PZEM-004T v3.0 Sensor
- Relay Module
- WiFi Connection

## 🚀 Next Steps
- Phase 2: ESP32 Backend Integration
- Phase 3: Real-time WebSocket Connection
- Phase 4: Production Deployment

---

**Developed by**: [Your Name]
**Date**: 2024
**Version**: 1.0.0 (UI Only)