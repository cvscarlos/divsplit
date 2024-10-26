export function GroupTransactions() {
	function handleGroupSubmit(event) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleGroupSubmit}>
			<div className="md:flex md:justify-center">
				<div className="ds-card md:w-1/2">
					<h4>Description</h4>
					<div className=" pt-5">
						Date: <input className="input input-bordered" type="date" name="date" />
					</div>
					<div className="pt-5 pb-5">
						Total: <input className="input input-bordered" type="number" name="value" />
					</div>
					<div>
						Description: <input className="input input-bordered" type="text" name="description" />
					</div>

					<h4>Paid by</h4>
					<div>
						<input type="checkbox" name="member1" />
						Alice Amount: <input className="input input-bordered" type="number" name="member1" />
					</div>

					<h4>Paid for</h4>
					<div>
						<input type="checkbox" name="member1" />
						Alice Amount: <input className="input input-bordered" type="number" name="member1" />
					</div>
				</div>
			</div>
		</form>
	);
}
