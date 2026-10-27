"""Compose la boucle originale « Quart de nuit » (72 BPM, ré mineur).
Relancer avec Python et NumPy pour reconstruire le fichier audio du jeu.
"""
from pathlib import Path
import wave
import numpy as np

RATE = 32000
BEAT = 60 / 72
LENGTH = 16 * 4 * BEAT
SIZE = round(LENGTH * RATE)
track = np.zeros((SIZE, 2), dtype=np.float64)
rng = np.random.default_rng(1936)

def add(signal, start, pan=0):
    # Les queues de réverbération reviennent au début pour une boucle continue.
    indices = (round(start * RATE) + np.arange(len(signal))) % SIZE
    gains = np.array([np.sqrt((1-pan)/2), np.sqrt((1+pan)/2)])
    np.add.at(track, indices, signal[:, None] * gains)

def note(midi, start, duration, volume, kind='keys', pan=0):
    t = np.arange(round(duration * RATE)) / RATE
    f = 440 * 2 ** ((midi - 69) / 12)
    if kind == 'pad':
        signal = (np.sin(2*np.pi*f*t) + .18*np.sin(2*np.pi*f*2*t))
        env = np.minimum(t/.5, 1) * np.minimum((duration-t)/.8, 1)
    elif kind == 'bass':
        signal = np.sin(2*np.pi*f*t) + .12*np.sin(2*np.pi*f*2*t)
        env = np.minimum(t/.025, 1) * np.exp(-t*1.8) * np.minimum((duration-t)/.15, 1)
    else:
        # Piano feutré ponctué d’un harmonique de métal très discret.
        signal = np.sin(2*np.pi*f*t) + .22*np.sin(2*np.pi*f*2*t)*np.exp(-t*4) + .05*np.sin(2*np.pi*f*3.01*t)*np.exp(-t*8)
        env = np.minimum(t/.012, 1) * np.exp(-t*2) * np.minimum((duration-t)/.1, 1)
    dry = signal * np.maximum(env, 0) * volume
    add(dry, start, pan)
    if kind != 'bass':
        for delay, gain in [(.19,.13),(.37,.09),(.61,.06)]:
            add(dry*gain, start+delay, -pan)

def drum(start, kind, volume):
    duration = .24 if kind == 'kick' else .13
    t = np.arange(round(duration*RATE))/RATE
    if kind == 'kick':
        signal = np.sin(2*np.pi*(46*t + 2*(1-np.exp(-t*28)))) * np.exp(-t*22)
    else:
        noise = rng.uniform(-1,1,len(t))
        noise = np.convolve(noise, np.ones(5)/5, mode='same')
        signal = noise*np.exp(-t*38) + .13*np.sin(2*np.pi*175*t)*np.exp(-t*45)
    add(signal*volume, start, -.12 if kind == 'kick' else .16)

# Dm9 / Bbmaj7 / Fmaj7 / Cadd9 : seize mesures, deux phrases complémentaires.
chords = [[50,57,60,64], [46,53,57,60], [48,53,57,64], [48,55,62,64]]
bass = [38,34,41,36]
melody = [[74,69,72,76],[77,74,72,69],[69,72,76,72],[74,72,67,69],
          [77,76,74,69],[72,74,77,81],[79,76,72,69],[74,72,69,64]]
for bar in range(16):
    start = bar*4*BEAT
    chord = (bar//2)%4
    for pitch in chords[chord]:
        note(pitch,start,4*BEAT+.65,.033,'pad',-.25)
    for beat in [0,2]:
        note(bass[chord],start+beat*BEAT,1.5*BEAT,.13,'bass')
        drum(start+beat*BEAT,'kick',.10)
    for beat in [1,3]:
        drum(start+beat*BEAT,'snare',.075)
        drum(start+(beat+.75)*BEAT,'snare',.018)
    # La mélodie laisse une mesure sur deux respirer.
    phrase = melody[bar//2]
    for index, beat in enumerate([.5,1.5,2.5,3.25] if bar%2==0 else [.5,2.5]):
        note(phrase[index],start+beat*BEAT,1.6,.075,'keys',.25)
track = np.tanh(track*1.1)
peak = np.max(np.abs(track))
track *= .68 / max(peak, .68)
output = Path(__file__).resolve().parent / 'dist/assets/quart-de-nuit.wav'
with wave.open(str(output),'wb') as wav:
    wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(RATE)
    wav.writeframes((track*32767).astype('<i2').tobytes())
print(f'{output.name}: {LENGTH:.2f} s, peak {np.max(np.abs(track)):.3f}')
