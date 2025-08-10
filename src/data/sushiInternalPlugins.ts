// Sushi Internal Plugins
// Source: https://elk-audio.github.io/elk-docs/html/documents/sushi_internal_plugins.html

export interface PluginParameter {
  name: string;
  description: string;
  range?: string;
  default?: string;
}

export interface PluginProperty {
  name: string;
  description: string;
}

export interface SushiInternalPlugin {
  uid: string;
  name: string;
  description: string;
  category: 'Audio In / Audio Out Plugins' | 'Midi In / Audio Out Plugins' | 'Midi In / Midi Out plugins' | 'Audio In / Parameter Out plugins' | 'CV In / Out plugins' | 'Utility plugins' | 'Brickworks plugins';
  parameters?: PluginParameter[];
  properties?: PluginProperty[];
}

export const SUSHI_INTERNAL_PLUGINS: SushiInternalPlugin[] = [
  // Audio In / Audio Out Plugins
  {
    uid: 'sushi.testing.passthrough',
    name: 'Passthrough',
    description: 'Simple bypass plugin',
    category: 'Audio In / Audio Out Plugins'
  },
  {
    uid: 'sushi.testing.gain',
    name: 'Gain',
    description: 'Simple gain plugin (not smoothed)',
    category: 'Audio In / Audio Out Plugins',
    parameters: [
      {
        name: 'gain',
        description: 'Gain in dB',
        range: '[-120, 24]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.testing.equalizer',
    name: 'Equalizer',
    description: 'Parametric peak equalizer (single band)',
    category: 'Audio In / Audio Out Plugins',
    parameters: [
      {
        name: 'frequency',
        description: 'Center frequency in Hz',
        range: '[20, 20000]',
        default: '1000.0'
      },
      {
        name: 'gain',
        description: 'Output gain in dB',
        range: '[-24, 24]',
        default: '0.0'
      },
      {
        name: 'q',
        description: 'Q factor of the filter',
        range: '[0, 10]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.testing.mono_summing',
    name: 'Mono Summing',
    description: 'Sums all input channels to mono',
    category: 'Audio In / Audio Out Plugins'
  },
  {
    uid: 'sushi.testing.sample_delay',
    name: 'Sample Delay',
    description: 'Simple delay plugin (up to 48000 samples)',
    category: 'Audio In / Audio Out Plugins',
    parameters: [
      {
        name: 'sample_delay',
        description: 'Delay in samples',
        range: '[0, 48000]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.testing.send',
    name: 'Send',
    description: 'Sends audio to a return bus plugin',
    category: 'Audio In / Audio Out Plugins',
    parameters: [
      {
        name: 'gain',
        description: 'Gain control of audio sent in dB',
        range: '[-120, 24]',
        default: '0.0'
      },
      {
        name: 'channel_count',
        description: 'Number of channels to send',
        range: '[0, 16]',
        default: 'All'
      },
      {
        name: 'start_channel',
        description: 'Channel number to start counting from',
        range: '[0, 16]',
        default: '0'
      },
      {
        name: 'dest_channel',
        description: 'Destination channel on return plugin',
        range: '[0, 16]',
        default: '0'
      }
    ],
    properties: [
      {
        name: 'destination_name',
        description: 'Name of a Return plugin instance to send audio to'
      }
    ]
  },
  {
    uid: 'sushi.testing.return',
    name: 'Return',
    description: 'Return bus plugin - receives audio from Send plugins',
    category: 'Audio In / Audio Out Plugins'
  },
  
  // Midi In / Audio Out Plugins
  {
    uid: 'sushi.testing.sampleplayer',
    name: 'Sample Player',
    description: 'Polyphonic sample-based player with ADSR envelope',
    category: 'Midi In / Audio Out Plugins',
    parameters: [
      {
        name: 'volume',
        description: 'Static gain for the sample in dB',
        range: '[-120, 36]',
        default: '0.0'
      },
      {
        name: 'attack',
        description: 'Envelope attack time in seconds',
        range: '[0, 10]',
        default: '0.0'
      },
      {
        name: 'decay',
        description: 'Envelope decay time in seconds',
        range: '[0, 10]',
        default: '0.0'
      },
      {
        name: 'sustain',
        description: 'Envelope sustain level',
        range: '[0, 1]',
        default: '1.0'
      },
      {
        name: 'release',
        description: 'Envelope release time in seconds',
        range: '[0, 10]',
        default: '0.0'
      }
    ],
    properties: [
      {
        name: 'sample_file',
        description: 'Path to .wav file to load'
      }
    ]
  },
  
  // Midi In / Midi Out plugins
  {
    uid: 'sushi.testing.arpeggiator',
    name: 'Arpeggiator',
    description: 'Simple arpeggiator with UP movement pattern',
    category: 'Midi In / Midi Out plugins',
    parameters: [
      {
        name: 'range',
        description: 'Octave range as integer',
        range: '[1, 5]',
        default: '2'
      }
    ]
  },
  {
    uid: 'sushi.testing.transposer',
    name: 'Transposer',
    description: 'Transposes MIDI notes by fixed semitones',
    category: 'Midi In / Midi Out plugins',
    parameters: [
      {
        name: 'transpose',
        description: 'Transpose amount in semitones',
        range: '[-24, 24]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.testing.step_sequencer',
    name: 'Step Sequencer',
    description: 'Simple 8-step sequencer',
    category: 'Midi In / Midi Out plugins',
    parameters: [
      {
        name: 'pitch_1-8',
        description: 'Pitch in semitones for each step',
        range: '[-24, 24]',
        default: '0.0'
      },
      {
        name: 'step_1-8',
        description: 'Step on/off for each step',
        range: '[0, 1]',
        default: '1.0'
      }
    ]
  },
  
  // Audio In / Parameter Out plugins
  {
    uid: 'sushi.testing.peakmeter',
    name: 'Peak Meter',
    description: 'Analyzes audio signal levels and outputs peak levels',
    category: 'Audio In / Parameter Out plugins',
    parameters: [
      {
        name: 'link_channels',
        description: 'Links channels 0 and 1 in stereo config',
        range: '[0, 1]',
        default: '0'
      },
      {
        name: 'only_peaks',
        description: 'Send only peak values louder than decaying value',
        range: '[0, 1]',
        default: '0'
      },
      {
        name: 'update_rate',
        description: 'Rate of peak updates in updates/s',
        range: '[0.1, 25]',
        default: '25'
      }
    ]
  },
  
  // CV In / Out plugins
  {
    uid: 'sushi.testing.cv_to_control',
    name: 'CV to Control',
    description: 'Converts CV/gate to MIDI note on/off messages',
    category: 'CV In / Out plugins',
    parameters: [
      {
        name: 'channel',
        description: 'MIDI channel',
        range: '[0, 16]',
        default: '0'
      },
      {
        name: 'tune',
        description: 'Coarse tune parameter',
        range: '[-24, 24]',
        default: '0.0'
      },
      {
        name: 'polyphony',
        description: 'Number of CV voices',
        range: '[1, 4]',
        default: '1'
      }
    ]
  },
  {
    uid: 'sushi.testing.control_to_cv',
    name: 'Control to CV',
    description: 'Converts MIDI note on/off to CV/gate information',
    category: 'CV In / Out plugins',
    parameters: [
      {
        name: 'send_velocity',
        description: 'Switch velocity transmission on/off',
        range: '[0, 1]',
        default: '0'
      },
      {
        name: 'send_modulation',
        description: 'Switch modulation transmission on/off',
        range: '[0, 1]',
        default: '0'
      },
      {
        name: 'retrigger_enabled',
        description: 'Switch retrigger mode on/off',
        range: '[0, 1]',
        default: '0'
      },
      {
        name: 'tune',
        description: 'Coarse tune parameter',
        range: '[-24, 24]',
        default: '0.0'
      },
      {
        name: 'fine_tune',
        description: 'Fine tune parameter',
        range: '[-1, 1]',
        default: '0.0'
      },
      {
        name: 'polyphony',
        description: 'Number of CV voices',
        range: '[1, 4]',
        default: '1'
      },
      {
        name: 'modulation',
        description: 'Modulation parameter',
        range: '[-1, 1]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.testing.stereo_mixer',
    name: 'Stereo Mixer',
    description: 'Mixes multiple stereo inputs to stereo output',
    category: 'Audio In / Audio Out Plugins'
  },
  {
    uid: 'sushi.testing.freeverb',
    name: 'Reverb (freeverb)',
    description: 'Freeverb-based reverb effect',
    category: 'Audio In / Audio Out Plugins'
  },
  
  // Utility plugins
  {
    uid: 'sushi.testing.wav_writer',
    name: 'Wav Writer',
    description: 'Records audio to WAV file',
    category: 'Utility plugins'
  },
  {
    uid: 'sushi.testing.wav_streamer',
    name: 'Wav Streamer',
    description: 'Streams audio from WAV file',
    category: 'Utility plugins'
  },
  
  // Brickworks plugins (high-quality FX)
  {
    uid: 'sushi.brickworks.bitcrusher',
    name: 'Bitcrusher',
    description: 'Sample rate and bit-depth reduction',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'sr_ratio',
        description: 'Sample rate reduction ratio',
        range: '[0.0, 1.0]',
        default: '1.0'
      },
      {
        name: 'bit_depth',
        description: 'Bit depth',
        range: '[1, 16]',
        default: '16'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.chorus',
    name: 'Chorus',
    description: 'Chorus with variable rate and amount',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'rate',
        description: 'Rate in Hz',
        range: '[0.01, 2.0]',
        default: '1.0'
      },
      {
        name: 'amount',
        description: 'FX amount (0=none, 1=full)',
        range: '[0.0, 1.0]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.clip',
    name: 'Hard Clipper',
    description: 'Antialiased hard clipper with bias and gain',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'bias',
        description: 'Input bias',
        range: '[-2.5, 2.5]',
        default: '0.0'
      },
      {
        name: 'gain',
        description: 'Linear compensation output gain',
        range: '[0.1, 10.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.comb_delay',
    name: 'Comb Delay',
    description: 'Comb filter/delay with feedforward and feedback',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'ff_delay',
        description: 'Feedforward delay time in seconds',
        range: '[0.0, 1.0]',
        default: '0.05'
      },
      {
        name: 'fb_delay',
        description: 'Feedback delay time in seconds',
        range: '[0.0, 1.0]',
        default: '0.05'
      },
      {
        name: 'blend',
        description: 'Blend coefficient',
        range: '[0.1, 10.0]',
        default: '1.0'
      },
      {
        name: 'ff_coeff',
        description: 'Feedforward coefficient',
        range: '[-1.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'fb_coeff',
        description: 'Feedback coefficient',
        range: '[-0.995, 0.995]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.compressor',
    name: 'Compressor',
    description: 'Feedforward compressor/limiter',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'threshold',
        description: 'Compression threshold in dB',
        range: '[-60, 12]',
        default: '0.0'
      },
      {
        name: 'ratio',
        description: 'Compression ratio',
        range: '[0.0, 1.0]',
        default: '1.0'
      },
      {
        name: 'attack',
        description: 'Attack time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'release',
        description: 'Release time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'gain',
        description: 'Output makeup gain in dB',
        range: '[-60, 60]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.dist',
    name: 'Distortion',
    description: 'Distortion effect (rodent-inspired)',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'dist',
        description: 'Distortion (input gain, approximately)',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'tone',
        description: 'Tone (filter) parameter',
        range: '[0.0, 1.0]',
        default: '0.5'
      },
      {
        name: 'volume',
        description: 'Volume (output gain)',
        range: '[0.0, 1.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.drive',
    name: 'Overdrive',
    description: 'Overdrive effect (screaming-inspired)',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'drive',
        description: 'Overdrive (input gain, approximately)',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'tone',
        description: 'Tone (filter) parameter',
        range: '[0.0, 1.0]',
        default: '0.5'
      },
      {
        name: 'volume',
        description: 'Volume (output gain)',
        range: '[0.0, 1.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.fuzz',
    name: 'Fuzz',
    description: 'Fuzz effect (smiling-inspired)',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'fuzz',
        description: 'Fuzz (input gain, approximately)',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'volume',
        description: 'Volume (output gain)',
        range: '[0.0, 1.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.highpass',
    name: 'Highpass Filter',
    description: 'First-order highpass filter (6 dB/oct)',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'frequency',
        description: 'Cutoff frequency in Hz',
        range: '[20.0, 20000.0]',
        default: '50.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.multi_filter',
    name: 'Multi Filter',
    description: 'Second-order multimode filter with blended modes',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'frequency',
        description: 'Cutoff frequency in Hz',
        range: '[20.0, 20000.0]',
        default: '1000.0'
      },
      {
        name: 'Q',
        description: 'Q factor',
        range: '[0.5, 10.0]',
        default: '1.0'
      },
      {
        name: 'input_coeff',
        description: 'Input mode coefficient',
        range: '[-1.0, 1.0]',
        default: '1.0'
      },
      {
        name: 'lowpass_coeff',
        description: 'Lowpass mode coefficient',
        range: '[-1.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'bandpass_coeff',
        description: 'Bandpass mode coefficient',
        range: '[-1.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'highpass_coeff',
        description: 'Highpass mode coefficient',
        range: '[-1.0, 1.0]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.eq3band',
    name: '3-band Equalizer',
    description: 'Equalizer with 2nd-order low shelf, peak and high shelf filters',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'lowshelf_freq',
        description: 'Low shelf cutoff frequency in Hz',
        range: '[25.0, 1000.0]',
        default: '125.0'
      },
      {
        name: 'lowshelf_gain',
        description: 'Low shelf gain in dB',
        range: '[-24, 24.0]',
        default: '0.0'
      },
      {
        name: 'lowshelf_q',
        description: 'Low shelf Q factor',
        range: '[0.5, 5.0]',
        default: '1.0'
      },
      {
        name: 'peak_freq',
        description: 'Peak cutoff frequency in Hz',
        range: '[25.0, 20000.0]',
        default: '1000.0'
      },
      {
        name: 'peak_gain',
        description: 'Peak gain in dB',
        range: '[-24, 24.0]',
        default: '0.0'
      },
      {
        name: 'peak_q',
        description: 'Peak Q factor',
        range: '[0.5, 5.0]',
        default: '1.0'
      },
      {
        name: 'highshelf_freq',
        description: 'High shelf cutoff frequency in Hz',
        range: '[1000.0, 20000.0]',
        default: '4000.0'
      },
      {
        name: 'highshelf_gain',
        description: 'High shelf gain in dB',
        range: '[-24, 24.0]',
        default: '0.0'
      },
      {
        name: 'highshelf_q',
        description: 'High shelf Q factor',
        range: '[0.5, 5.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.flanger',
    name: 'Flanger',
    description: 'Flanger with variable rate and amount',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'rate',
        description: 'Rate in Hz',
        range: '[0.01, 2.0]',
        default: '1.0'
      },
      {
        name: 'amount',
        description: 'FX amount (0=none, 1=full)',
        range: '[0.0, 1.0]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.noise_gate',
    name: 'Noise Gate',
    description: 'Noise gate; in multichannel setup, each channel is gated independently',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'threshold',
        description: 'Threshold in dB',
        range: '[-60.0, 60.0]',
        default: '0.0'
      },
      {
        name: 'ratio',
        description: 'Compression ratio (0 = no gating, 1 = hard gate)',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'attack',
        description: 'Attack time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.0'
      },
      {
        name: 'release',
        description: 'Release time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.notch',
    name: 'Notch Filter',
    description: 'Second-order notch filter with unity gain at DC and asymptotically as frequency increases',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'frequency',
        description: 'Center frequency in Hz',
        range: '[20.0, 20000.0]',
        default: '1000.0'
      },
      {
        name: 'Q',
        description: 'Q factor',
        range: '[0.5, 10.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.phaser',
    name: 'Phaser',
    description: 'Phaser containing 4 1st-order allpass filters modulated by a sinusoidal LFO',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'rate',
        description: 'Modulation rate in Hz',
        range: '[0.5, 5.0]',
        default: '1.0'
      },
      {
        name: 'center',
        description: 'Center frequency in Hz',
        range: '[100, 10000.0]',
        default: '1000.0'
      },
      {
        name: 'amount',
        description: 'Modulation amount in octaves',
        range: '[0.0, 4.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.saturation',
    name: 'Saturation',
    description: 'Antialiased tanh-based saturation with parametric bias and gain',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'bias',
        description: 'Input bias',
        range: '[-2.5, 2.5]',
        default: '0.0'
      },
      {
        name: 'gain',
        description: 'Input gain',
        range: '[0.1, 10.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.tremolo',
    name: 'Tremolo',
    description: 'Tremolo with variable speed and amount',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'rate',
        description: 'Modulation rate in Hz',
        range: '[1.0, 20.0]',
        default: '1.0'
      },
      {
        name: 'amount',
        description: 'Modulation amount (0 = no tremolo, 1 = full tremolo)',
        range: '[0.0, 1.0]',
        default: '1.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.vibrato',
    name: 'Vibrato',
    description: 'Vibrato with variable speed and amount',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'rate',
        description: 'Rate in Hz',
        range: '[2.0, 10.0]',
        default: '4.0'
      },
      {
        name: 'amount',
        description: 'FX amount (0=none, 1=full)',
        range: '[0.0, 1.0]',
        default: '0.0'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.wah',
    name: 'Wah',
    description: 'Simple wah digital effect',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'wah',
        description: 'Wah pedal position (0 = low cutoff, 1 = high cutoff)',
        range: '[0.0, 1.0]',
        default: '0.5'
      }
    ]
  },
  {
    uid: 'sushi.brickworks.simple_synth',
    name: 'Simple Synthesizer',
    description: 'Very simple monophonic synthesizer with PWM oscillator, lowpass filter and ADSR envelope',
    category: 'Brickworks plugins',
    parameters: [
      {
        name: 'volume',
        description: 'Output volume in dB',
        range: '[-60.0, 12.0]',
        default: '0.0'
      },
      {
        name: 'portamento',
        description: 'Portamento time in seconds',
        range: '[0.0, 1.0]',
        default: '0.01'
      },
      {
        name: 'pulse_width',
        description: 'Pulse width',
        range: '[0.0, 1.0]',
        default: '0.5'
      },
      {
        name: 'filter_cutoff',
        description: 'Filter cutoff in Hz',
        range: '[20.0, 20000.0]',
        default: '4000.0'
      },
      {
        name: 'filter_Q',
        description: 'Filter Q factor / resonance',
        range: '[0.5, 10.0]',
        default: '1.0'
      },
      {
        name: 'attack',
        description: 'Attack time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.01'
      },
      {
        name: 'decay',
        description: 'Decay time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.01'
      },
      {
        name: 'sustain',
        description: 'Sustain level',
        range: '[0.0, 1.0]',
        default: '1.0'
      },
      {
        name: 'release',
        description: 'Release time constant in seconds',
        range: '[0.0, 1.0]',
        default: '0.01'
      }
    ]
  }
];

export const getInternalPluginByUid = (uid: string): SushiInternalPlugin | undefined => {
  return SUSHI_INTERNAL_PLUGINS.find(plugin => plugin.uid === uid);
};

export const getInternalPluginsByCategory = (category: 'Audio In / Audio Out Plugins' | 'Midi In / Audio Out Plugins' | 'Midi In / Midi Out plugins' | 'Audio In / Parameter Out plugins' | 'CV In / Out plugins' | 'Utility plugins' | 'Brickworks plugins'): SushiInternalPlugin[] => {
  return SUSHI_INTERNAL_PLUGINS.filter(plugin => plugin.category === category);
};

export const getAllCategories = (): ('Audio In / Audio Out Plugins' | 'Midi In / Audio Out Plugins' | 'Midi In / Midi Out plugins' | 'Audio In / Parameter Out plugins' | 'CV In / Out plugins' | 'Utility plugins' | 'Brickworks plugins')[] => {
  const categories = new Set<'Audio In / Audio Out Plugins' | 'Midi In / Audio Out Plugins' | 'Midi In / Midi Out plugins' | 'Audio In / Parameter Out plugins' | 'CV In / Out plugins' | 'Utility plugins' | 'Brickworks plugins'>();
  SUSHI_INTERNAL_PLUGINS.forEach(plugin => categories.add(plugin.category));
  return Array.from(categories).sort();
};
