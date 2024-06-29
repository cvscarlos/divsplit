export default function Loading() {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center" style={{ zIndex: 10 }}>
			<span className="loading loading-spinner loading-lg text-accent">Loading ...</span>
		</div>
	);
}
