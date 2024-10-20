export function GroupTransactions() {
	function handleGroupSubmit(event) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleGroupSubmit}>
			<h4>Description</h4>
			<div>
				Date: <input type="date" name="date" />
			</div>
			<div>
				Total: <input type="number" name="value" />
			</div>
			<div>
				Description: <input type="text" name="description" />
			</div>

			<h4>Paid by</h4>
			<div>
				<input type="checkbox" name="member1" />
				Alice Amount: <input type="number" name="member1" />
			</div>

			<h4>Paid for</h4>
			<div>
				<input type="checkbox" name="member1" />
				Alice Amount: <input type="number" name="member1" />
			</div>
		</form>
	);
}
