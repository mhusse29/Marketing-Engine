/* eslint-disable @typescript-eslint/no-explicit-any */

import { useGSAP } from "@gsap/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useMemo, useRef, useEffect, memo } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import { AuthTransitionProvider, useAuthTransition } from "../contexts/AuthTransitionContext";
import { createSuccessTransitionTimeline } from "../lib/transitionAnimations";

interface ShaderPlaneProps {
	vertexShader: string;
	fragmentShader: string;
	uniforms: { [key: string]: { value: unknown } };
}

function ShaderPlane({ vertexShader, fragmentShader, uniforms }: ShaderPlaneProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const { size } = useThree();

	useFrame((state) => {
		if (meshRef.current) {
			const material = meshRef.current.material as THREE.ShaderMaterial;
			material.uniforms.u_time.value = state.clock.elapsedTime * 0.5;
			material.uniforms.u_resolution.value.set(size.width, size.height, 1.0);
		}
	});

	return (
		<mesh ref={meshRef}>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				side={THREE.DoubleSide}
				depthTest={false}
				depthWrite={false}
			/>
		</mesh>
	);
}

interface ShaderBackgroundProps {
	vertexShader?: string;
	fragmentShader?: string;
	uniforms?: { [key: string]: { value: unknown } };
	className?: string;
}

const ShaderBackground = memo(function ShaderBackground({
	vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
	fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform float u_time;
    uniform vec3 u_resolution;
    uniform sampler2D iChannel0;

    #define STEP 256
    #define EPS .001

    float smin( float a, float b, float k ) {
        float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
        return mix( b, a, h ) - k*h*(1.0-h);
    }

    const mat2 m = mat2(.8,.6,-.6,.8);

    float noise( in vec2 x ) {
      return sin(1.5*x.x)*sin(1.5*x.y);
    }

    float fbm6( vec2 p ) {
        float f = 0.0;
        f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;
        f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;
        f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;
        f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;
        f += 0.015625*(0.5+0.5*noise( p ));
        return f/0.96875;
    }

    mat2 getRot(float a) {
        float sa = sin(a), ca = cos(a);
        return mat2(ca,-sa,sa,ca);
    }

    vec3 _position;

    float sphere(vec3 center, float radius) {
        return distance(_position,center) - radius;
    }

    float swingPlane(float height) {
        vec3 pos = _position + vec3(0.,0.,u_time * 5.5);
        float def =  fbm6(pos.xz * .25) * 0.5;
        float way = pow(abs(pos.x) * 34. ,2.5) *.0000125;
        def *= way;
        float ch = height + def;
        return max(pos.y - ch,0.);
    }

    float map(vec3 pos) {
        _position = pos;
        float dist;
        dist = swingPlane(0.);
        float sminFactor = 5.25;
        dist = smin(dist,sphere(vec3(0.,-15.,80.),60.),sminFactor);
        return dist;
    }

    vec3 getNormal(vec3 pos) {
        vec3 nor = vec3(0.);
        vec3 vv = vec3(0.,1.,-1.)*.01;
        nor.x = map(pos + vv.zxx) - map(pos + vv.yxx);
        nor.y = map(pos + vv.xzx) - map(pos + vv.xyx);
        nor.z = map(pos + vv.xxz) - map(pos + vv.xxy);
        nor /= 2.;
        return normalize(nor);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
      vec2 uv = (fragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
      vec3 rayOrigin = vec3(uv + vec2(0.,6.), -1. );
      vec3 rayDir = normalize(vec3(uv , 1.));
      rayDir.zy = getRot(.15) * rayDir.zy;
      vec3 position = rayOrigin;
      
      float curDist;
      int nbStep = 0;
      
      for(; nbStep < STEP;++nbStep) {
          curDist = map(position + (texture(iChannel0, position.xz) - .5).xyz * .005);
          if(curDist < EPS) break;
          position += rayDir * curDist * .5;
      }
      
      float f;
      float dist = distance(rayOrigin,position);
      f = dist /(98.);
      f = float(nbStep) / float(STEP);
      f *= .9;
      vec3 col = vec3(f);
      fragColor = vec4(col,1.0);
    }

    void main() {
      vec4 fragColor;
      vec2 fragCoord = vUv * u_resolution.xy;
      mainImage(fragColor, fragCoord);
      gl_FragColor = fragColor;
    }
  `,
	uniforms = {},
	className = "w-full h-full",
}: ShaderBackgroundProps) {
	const shaderUniforms = useMemo(
		() => ({
			u_time: { value: 0 },
			u_resolution: { value: new THREE.Vector3(1, 1, 1) },
			...uniforms,
		}),
		[uniforms],
	);

	return (
		<div className={className}>
			<Canvas className={className}>
				<ShaderPlane
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					uniforms={shaderUniforms}
				/>
			</Canvas>
		</div>
	);
});

function AuthPageContent() {
	const bgRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const timelineRef = useRef<gsap.core.Timeline | null>(null);
	const isAnimatingRef = useRef<boolean>(false);
	const navigate = useNavigate();
	const { phase, userName, setPhase } = useAuthTransition();
	
	// Store navigate and setPhase in refs to avoid re-creating timeline
	const navigateRef = useRef(navigate);
	const setPhaseRef = useRef(setPhase);
	navigateRef.current = navigate;
	setPhaseRef.current = setPhase;

	// Initial background animation
	useGSAP(() => {
		gsap.set(bgRef.current, { filter: "blur(20px)", opacity: 0.8 });
		
		const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
		tl.to(bgRef.current, { 
			filter: "blur(0px)", 
			opacity: 1,
			duration: 1.2 
		}, 0);
	}, []);

	// Success transition animation - only create once
	useEffect(() => {
		console.log('🔄 Effect running - phase:', phase, 'isAnimating:', isAnimatingRef.current, 'timelineExists:', !!timelineRef.current);
		
		// Guard against duplicate creation - check both timeline ref AND isAnimating flag
		if (phase === 'success-show' && !timelineRef.current && !isAnimatingRef.current && 
		    cardRef.current && overlayRef.current && bgRef.current) {
			console.log('🎬 Starting auth transition animation...');
			console.log('User:', userName);
			console.log('Elements ready - cardRef:', !!cardRef.current, 'overlayRef:', !!overlayRef.current);
			
			// Set flag immediately to prevent any duplicate creation
			isAnimatingRef.current = true;
			
			const timeline = createSuccessTransitionTimeline({
				cardElement: cardRef.current,
				overlayElement: overlayRef.current,
				bgElement: bgRef.current,
				onPhaseChange: (newPhase) => {
					console.log('📍 Phase change:', newPhase);
					setPhaseRef.current(newPhase as any);
				},
				onComplete: () => {
					console.log('✅ Animation complete, navigating...');
					// Clear refs after completion
					timelineRef.current = null;
					isAnimatingRef.current = false;
					// Navigate to main app after animation completes
					setTimeout(() => {
						console.log('🚀 Executing navigation...');
						navigateRef.current('/');
					}, 200);
				},
			});

			console.log('Timeline created, storing in ref and playing...');
			timelineRef.current = timeline;
			timeline.play();
			console.log('Timeline state - paused:', timeline.paused(), 'progress:', timeline.progress(), 'duration:', timeline.duration());
		} else if (phase === 'success-show') {
			console.log('⚠️ Animation NOT starting - timelineExists:', !!timelineRef.current, 'isAnimating:', isAnimatingRef.current);
		}
	}, [phase, userName]); // Only phase and userName, others are in refs

	// Separate cleanup effect that only runs on unmount
	useEffect(() => {
		return () => {
			if (timelineRef.current) {
				console.log('Component unmounting, cleaning up timeline');
				timelineRef.current.kill();
				timelineRef.current = null;
			}
		};
	}, []); // Empty deps = only run on mount/unmount

	// Memoize background to prevent re-renders during animation
	const backgroundComponent = useMemo(() => (
		<ShaderBackground className="h-full w-full" />
	), []); // Empty deps = never re-render

	return (
		<div className="relative min-h-screen w-full overflow-hidden bg-black">
			{/* Animated Background - memoized to prevent WebGL context loss */}
			<div ref={bgRef} className="absolute inset-0">
				{backgroundComponent}
			</div>

			{/* Radial Gradient Overlay */}
			<div 
				ref={overlayRef}
				className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_50%,_transparent_30%,_black_100%)]" 
			/>

			{/* Auth Card Container */}
			<div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 md:px-6">
				<div ref={cardRef} className="w-full max-w-md relative" style={{ transformOrigin: 'center center' }}>
					<AuthCard phase={phase} userName={userName} />
				</div>
			</div>

			{/* Back to App Link */}
			<div className="absolute top-6 left-6 z-20">
				<a
					href="/Marketing-Engine/"
					className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 group"
				>
					<svg
						className="w-4 h-4 transition-transform group-hover:-translate-x-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					<span className="text-sm font-medium">Back to App</span>
				</a>
			</div>
		</div>
	);
}

export default function AuthPage() {
	return (
		<AuthTransitionProvider>
			<AuthPageContent />
		</AuthTransitionProvider>
	);
}
