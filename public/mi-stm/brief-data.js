export const BRIEF = [
  {
    id:'question',group:'Rationale',nav:'Clinical question',label:'RESEARCH QUESTION',
    title:'Which learned speech cues improve recognition in noise?',
    lead:'MI-STM asks which spectral and temporal properties of a learned talker improve word recognition when transferred to new utterances, and whether these properties act separately or jointly in listeners with sensorineural hearing loss.',
    paragraphs:[
      'The second question is whether the resulting listener-specific cue profile can identify effective training. The proposed clinical endpoint is recognition of previously unheard talkers in noise, four weeks after training.',
      'The rationale combines familiar-talker benefits in hearing loss with evidence that listeners differ in their use of phonetic cues. Neither finding establishes the effectiveness of a profile-guided intervention. [[souza2013]] [[souza2020]]'
    ],
    decision:'Evaluate two claims separately: clinical benefit from the training policy, and incremental predictive value from MI descriptors.',
    figure:'question',caption:'Proposed causal sequence. Behavioral and computational outcomes are separate validation targets; no participant results are shown.',
    detailTitle:'Population, scope and terminology',
    details:[
      'The intended primary cohort comprises native-language adult listeners with bilateral sensorineural hearing loss. Age-matched listeners with typical hearing can provide a comparison in the profiling stage. Cochlear implant users require a separate protocol and analysis.',
      'A cue profile describes conditional recognition performance. An anchor is a stored recording. A trajectory is a sequence of selected recordings. Familiarity must be established behaviorally. The current protocol addresses speech-in-noise difficulty; tinnitus is outside its efficacy claim.',
      'The interface is a research prototype. It contains schematic bank coordinates and an illustrative text-comparison task. It is not a registered trial, an audiometric assessment or a validated rehabilitation product.'
    ],refs:['souza2013','souza2020']
  },
  {
    id:'signal',group:'Rationale',nav:'From music to speech',label:'CONCEPTUAL ORIGIN',
    title:'One signal supports several perceptual organizations.',
    lead:'The earlier acoustic-to-musical framework treated timbre, rhythm, melody and harmony as different organizations of one pressure waveform. The present study retains its logic of controlled construction and reciprocal perturbation.',
    paragraphs:[
      'For speech, the relevant descriptions include spectral envelope, frication spectrum, segment durations and trajectories across phoneme boundaries. Frequency and time are coupled descriptions of the same signal. Two experimental coordinates do not establish independent perceptual resources. [[ashby1986]] [[albouy]]',
      'We chose speech as the primary task because open-set word report and speech reception thresholds provide explicit outcomes. Musical structure remains a source of experimental ideas; its successful perception would require a separate transfer test. [[zokoll2015]]'
    ],
    decision:'Specify individual cue manipulations and quantify their residual coupling before interpreting the spectral–temporal plane.',
    figure:'signal',caption:'Analytical schematic of a common signal and complementary descriptions. The time–frequency resolution limit is not a model of attentional capacity.',
    detailTitle:'What carries over from the original framework',
    details:[
      'Retain matched event inventories, multiple acoustic realizations, minimum-edit perturbations and reciprocal changes between reference endpoints. These controls prevent a single recording or a change in global level from explaining the effect.',
      'A spectral envelope is not all of timbre. Segmental timing is not temporal fine structure. Harmonicity reflects regularity across components and is related to temporal periodicity. Aperiodic consonants can carry essential phonetic information. Harmonicity must therefore be a conditional descriptor, not a universal difficulty scale. [[harm]] [[rajappa2023]]',
      'Human auditory cortex integrates information over multiple scales, but candidate computational windows such as 0.15, 0.60 and 2.40 seconds remain model choices. They are not established classes of human attention. [[norman2022]] [[time]]'
    ],refs:['ashby1986','albouy','zokoll2015','harm','rajappa2023','norman2022','time']
  },
  {
    id:'selection',group:'Rationale',nav:'Learning and selection',label:'AUDITORY SCENE ANALYSIS',
    title:'Prior exposure can change how a source is selected.',
    lead:'The McDermott literature motivated the move from acoustic description to an experimentally testable account of learned source selection.',
    paragraphs:[
      'Embedded repetition, attentive tracking, learned target regularities and learned background statistics each provide routes to organizing a mixture. These are distinct experimental effects, rather than interchangeable labels for one learning mechanism. [[rep]] [[track]] [[schema]] [[noise]]',
      'More recent feature-gain models predict several successes and failures of cued speech selection. They motivate stimulus-computable predictions, while leaving the biological implementation and the clinical value of training open. [[griffith2026]]'
    ],
    decision:'Use learned regularity and cue-dependent selection as hypotheses. Establish their relevance in hearing loss through behavioral tests.',
    figure:'lineage',caption:'Conceptual lineage of the proposal. The sequence records different research questions; it does not imply an established rehabilitation mechanism.',
    detailTitle:'Why target and masker experience must be separated',
    details:[
      'A listener may benefit from knowing the target, learning a recurring background, or exploiting a stable relation between them. Target identity and masker identity should therefore be counterbalanced, and transfer should include previously unheard maskers.',
      'The task-irrelevant distractor result in schema learning and the benefit from learned background noise concern different task and stimulus settings. They do not justify a general claim that familiarity always helps or that attention is always necessary. [[schema]] [[noise]] [[inatt]]',
      'Changes in recognition can arise through source segregation, phonetic decoding or response selection. Behavioral cue effects should not be reported as direct estimates of an attention budget. [[popham2018]] [[okazawa]]'
    ],refs:['rep','track','schema','noise','griffith2026','inatt','popham2018','okazawa']
  },
  {
    id:'familiarity',group:'Rationale',nav:'Familiarity and cue use',label:'EMPIRICAL STARTING POINT',
    title:'A familiar voice is a useful reference, not an explanation.',
    lead:'Familiar-talker benefits establish that recognition depends on experience with a source. They do not identify which learned acoustic components support that benefit.',
    paragraphs:[
      'Older listeners with hearing loss understood familiar talkers better under controlled listening conditions. Laboratory voice learning also improved intelligibility, with a different exposure dependence from explicit voice recognition. [[souza2013]] [[holmes2021]]',
      'Familiar-voice benefit need not coincide with finer F0 or vocal-tract-length discrimination. Speech-specific cue profiles also vary across listeners, and masker modulation can change estimated spectral weighting. [[holmes2023]] [[souza2020]] [[shen2023]]'
    ],
    decision:'Measure recognition, familiarity and cue sensitivity separately. Use randomized familiarization to distinguish learning from intrinsically intelligible voices.',
    figure:'familiarity',caption:'Three distinct observables. The proposed study tests their relationship rather than treating one as a surrogate for the others.',
    detailTitle:'Why we retained an F0 constraint',
    details:[
      'Fundamental frequency is a potential source-segregation and identity cue. Personal anchor selection therefore constrains the voiced-F0 distribution independently of spectral-envelope distance. Similar F0 does not establish familiarity, and it does not identify speaker sex.',
      'The prototype compares P10, median and P90 in semitones. Its initial 3-semitone tolerance is illustrative. The final tolerance, tracking confidence and voiced-frame coverage require pilot validation; matched distributions can still have different F0 trajectories.',
      'Voice familiarization can also affect listening effort. Accuracy, effort and physiological responses should remain distinct outcomes. [[baxter2025]]'
    ],refs:['souza2013','holmes2021','holmes2023','souza2020','shen2023','baxter2025']
  },
  {
    id:'gap',group:'Rationale',nav:'The remaining gap',label:'PRIOR INTERVENTIONS',
    title:'The unresolved question is how to select useful training.',
    lead:'Auditory training, personalized phoneme practice and transfer to speech-in-noise tasks all have prior literature. MI-STM must demonstrate a specific advantage over those precedents.',
    paragraphs:[
      'Individualized phoneme training reduced targeted confusions in adult cochlear implant users, although that study had no control group. In a separate hearing-aid study, some phoneme gains persisted for three months without significant sentence-in-noise improvement. [[philpott2025]] [[koprowska2023]]',
      'Transfer is possible in other paradigms: a randomized competing-talker training study reported speech-in-noise generalization retained for at least four weeks, without transfer to analytical tasks. [[wilderode2025]]'
    ],
    decision:'Test whether a measured and reproducible cue profile improves training selection beyond an equally intensive general programme.',
    figure:'evidence',caption:'Qualitative comparison of reported outcomes. Different populations, tasks and controls prevent a common efficacy ranking.',
    detailTitle:'What would constitute a contribution',
    details:[
      'The distinctive claim is prospective: a baseline profile predicts which cue-focused practice is useful, and the resulting policy improves recognition of untrained natural talkers in an independent sample. Neither a personalized interface nor a closed loop establishes that claim.',
      'Prior personalized-versus-general training and talker-specific learning studies make an active comparator essential. Improvement relative to baseline alone could reflect retesting, exposure or task-specific practice. [[magits2023]] [[barcroft2016]]',
      'This bibliography supports a bounded research gap. It is not an exhaustive proof that no related protocol exists. Population, stimulus control, training policy and transfer endpoint define the claim.'
    ],refs:['philpott2025','koprowska2023','wilderode2025','magits2023','barcroft2016']
  },
  {
    id:'bank',group:'Design',nav:'Stimulus architecture',label:'MORPHBANK AND PERSONAL SPACE',
    title:'The coordinates come from the recordings.',
    lead:'ElevenLabs supplies candidate utterances. A fixed MI configuration measures the audio; quality checks and reference-relative descriptors determine which recordings enter a listener’s trajectory.',
    paragraphs:[
      'R³ denotes the selected acoustic descriptors; T³ denotes their specified temporal summaries. The two-dimensional view compresses these measurements. The full feature vectors and nuisance-variable checks remain authoritative.',
      'The earlier manuscript proposed parametric resynthesis. The current interface uses discrete, pre-generated anchors. Parametric voice morphing is available and may still be needed for controlled cue probes; generative settings alone do not isolate spectral and temporal interventions. [[belin2025]] [[skuk2020]]'
    ],
    decision:'Separate candidate generation, acoustic measurement, experimental acceptance and listener-response modelling.',
    figure:'bank',caption:'Current stimulus architecture. Z specifies an external target-to-masker ratio after target selection; the mixed waveform is not the clean-target coordinate system.',
    detailTitle:'Acceptance criteria and the meaning of the axes',
    details:[
      'X indexes a defined spectral descriptor projection or distance; Y indexes a temporal-summary projection or distance. Neither is a clinical hearing-loss axis. All personal routes use a behaviorally established reference and an independently applied F0 gate.',
      'Human speech and non-speech sounds are separate masker classes. Their effects cannot be reduced to level alone. Fix or model masker identity, modulation, spatial configuration and actual presentation-chain processing. [[shen2023]] [[yun2024]]',
      'Store the text ID, audio hash, voice and model version, extraction configuration, phonetic alignment and acceptance decisions. Timestamps from a speech generator require phonetic and pronunciation validation. [[elevenlabs]]',
      'Nearest-neighbour selection in a plot is an interface convenience. Confirmatory stimuli need prespecified tolerances on target displacement, nuisance displacement, naturalness and intelligibility. Sparse coverage should trigger additional generation or controlled resynthesis.'
    ],refs:['belin2025','skuk2020','shen2023','yun2024','elevenlabs'],action:{label:'Inspect the stimulus workspace',target:'#space'}
  },
  {
    id:'identification',group:'Design',nav:'Causal identification',label:'LEARNING × CUE INTERVENTION',
    title:'Estimate component effects before interpreting a trajectory.',
    lead:'The core probe crosses a specified spectral change with a specified temporal change in matched linguistic material. Reciprocal contrasts test both adding a learned component and replacing it.',
    paragraphs:[
      'Counterbalance physical talkers across listeners. Randomize familiarization with endpoint B versus a third voice C that is absent from the A/B space. Use new sentences before and after exposure and on a separate replication day.',
      'The four corner conditions estimate spectral, temporal and joint effects. A learning-specific change is the pre–post contrast in the B-trained arm minus the corresponding change in the C-trained arm. The interaction is not assigned a positive sign in advance.'
    ],
    decision:'Claim causal cue effects only when acoustic acceptance checks establish the intended contrasts. Otherwise report conditional associations.',
    figure:'factorial',caption:'Proposed factorial probe. A and B denote acoustic realizations; neither is a zero-information endpoint. The design requires accepted stimuli, not merely a populated bank.',
    detailTitle:'Estimands, attention and identifiability',
    details:[
      'For word-correct log odds q, define I = q₁₁ − q₁₀ − q₀₁ + q₀₀. Learning-dependent integration is the between-arm difference in the pre–post change in I. Report probability-scale marginal effects alongside model-scale contrasts.',
      'A nonsignificant interaction does not demonstrate independence. Evidence for practical additivity requires a prespecified equivalence region and adequate precision. Spectral and temporal contrasts should not be normalized to a constant sum: such normalization imposes a trade-off. [[ashby1986]]',
      'A hierarchical response model should represent listener, sentence, talker and masker variation. These estimates describe sensitivity to interventions; they do not measure percentages of attention. Context-sensitive weighting already has empirical precedent. [[souza2020]] [[shen2023]]'
    ],refs:['ashby1986','souza2020','shen2023']
  },
  {
    id:'adaptation',group:'Design',nav:'Response-guided learning',label:'TEST → PROFILE → PROBE → TRAIN',
    title:'A recurring error becomes a candidate training target.',
    lead:'Listeners transcribe what they hear. Repeated confusions are related to local acoustic descriptors, phonetic context and masker conditions, with uncertainty carried into the selection policy.',
    paragraphs:[
      'A word substitution is an observation. Attribution to a phoneme requires verified pronunciation and alignment; attribution to a cue requires a controlled probe. Low harmonicity alone is not evidence that a segment is difficult. [[harm]] [[rajappa2023]]',
      'Independent learning probes determine whether a reproducible weakness is modifiable. The training policy then chooses suitable anchors, or requests additional candidates that are measured and checked before entering the same bank. [[wang2008]] [[philpott2025]]'
    ],
    decision:'Preserve raw responses and distinguish acoustic description, behavioral estimation and training allocation.',
    figure:'loop',caption:'Proposed adaptive loop. The current page implements text comparison and a generation brief; it does not fit a listener model or deliver a validated listening intervention.',
    detailTitle:'Online delivery and protection against circular evaluation',
    details:[
      'Open-set word report is the principal recognition measure. Specify language-specific normalization and spelling rules in advance. Inspect uncertain phonetic alignments and distinguish target-word errors from masker intrusions.',
      'Use controlled output devices and presentation settings, document hearing-aid use and verify the delivered acoustic contrast. A browser can support delivery, but an uncalibrated online score is not an audiometric threshold.',
      'Adaptive training can become harder as performance improves; raw training accuracy is therefore not a longitudinal efficacy endpoint. Keep held-out assessment material outside the selection algorithm and freeze the policy before the independent efficacy trial.'
    ],refs:['harm','rajappa2023','wang2008','philpott2025'],action:{label:'Inspect the adaptive loop',target:'#adaptiveLoop'}
  },
  {
    id:'transfer',group:'Evaluation',nav:'Transfer and retention',label:'INDEPENDENT EFFICACY TEST',
    title:'The decisive outcome is recognition of untrained speech.',
    lead:'After profiling and policy development, an independent cohort would compare profile-guided training with a dose-matched, nonpersonalized active programme.',
    paragraphs:[
      'The groups receive matched task families, feedback, talker pools and training time. The manipulated factor is the selection policy. The primary contrast is baseline-adjusted speech reception threshold for unheard natural talkers, four weeks after training.',
      'Immediate transfer and masker-specific outcomes are secondary. Training gains, identity recognition and reduced effort cannot substitute for the retained speech-recognition endpoint. Prior positive and null transfer findings motivate this separation. [[wilderode2025]] [[koprowska2023]]'
    ],
    decision:'Evaluate the policy on speakers, utterances and assessment recordings that were never used to select or train it.',
    figure:'trial',caption:'Proposed evaluation schedule. The prototype retains a 4–6-week planning range; a single training dose and endpoint schedule must be frozen before registration.',
    detailTitle:'Outcome and analysis commitments',
    details:[
      'Use a validated, language-appropriate speech-in-noise assessment with permitted test materials; the Turkish Matrix test is one relevant external measure. Lower SRT denotes recognition at a less favorable target-to-masker ratio. [[zokoll2015]]',
      'Specify concealed allocation, blinded outcome assessment, intention-to-treat analysis and missing-data sensitivity analyses. Pilot-based simulations must determine the sample size, precision target and smallest effect of interest. No efficacy sample size is fixed by this interface.',
      'A retained improvement supports the training policy in the tested population and setting. Improvement confined to trained voices or words supports narrower learning. A precisely estimated absence of worthwhile between-arm benefit would reject the efficacy claim.'
    ],refs:['wilderode2025','koprowska2023','zokoll2015']
  },
  {
    id:'inference',group:'Evaluation',nav:'Validation and readiness',label:'SEPARATE CLAIMS, SEPARATE TESTS',
    title:'MI validation requires prediction beyond simpler baselines.',
    lead:'Clinical benefit and computational explanatory value can succeed or fail independently. The proposal therefore needs separate endpoints and explicit failure criteria.',
    paragraphs:[
      'Compare MI-based predictions with phoneme identity, SNR, exposure and conventional acoustic descriptors under matched inputs. Use held-out talkers and listeners, nested model selection and prespecified calibration measures.',
      'EEG and prefrontal fNIRS are optional mechanistic extensions. Cortical tracking and hemodynamic responses may constrain an account of selection or effort; they are not substitute measures of clinical benefit or direct readouts of an attention budget. [[osullivan2015]] [[stoll2025]] [[yucel2021]]'
    ],
    decision:'Finalize the stimulus pilot, cue definitions, policy, primary outcome and analysis plan before confirmatory recruitment.',
    figure:'validation',caption:'Inferential hierarchy. Each claim requires its own evidence; model fit and neural correlation do not establish a rehabilitation mechanism.',
    detailTitle:'Registration gates and optional temporal-context extension',
    details:[
      'Before registration: fix the speech feature subset, temporal windows, F0 tolerances, target and nuisance acceptance criteria, eligible-profile rule, training dose, assessment materials, sample size and equivalence bounds. Ethics review and voice-use permissions precede recruitment and stimulus collection.',
      'A secondary experiment can hold the final target/masker probe constant while changing preceding acoustic order. Preceding-rhythm effects and UW work on rhythm and neural tracking provide relevant prior art; the contribution would concern learning-dependent contextual effects under matched histories. [[smith2024]] [[schell2026]]',
      'EEG tracking needs acoustically counterbalanced target/masker conditions. fNIRS requires short-separation measurements and physiological/motion control, and cannot resolve a 150-ms model window. Increased tracking or hemodynamic amplitude alone would not validate a specific MI mechanism. [[yucel2021]]',
      'Current implementation: interactive bank selection, F0 filtering, schematic trajectories, text-comparison preview and a generation brief. Pending: generated research stimuli, acoustic validation, listener data, a fitted model and an intervention trial.'
    ],refs:['osullivan2015','stoll2025','yucel2021','smith2024','schell2026'],action:{label:'Open the research workspace',target:'#space'}
  }
];
