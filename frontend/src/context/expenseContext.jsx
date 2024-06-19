import { createContext,useState } from "react";
import PropTypes from 'prop-types';



const expenseContext = createContext();
ExpenseProvider.prototype = {
    children: PropTypes.node.isRequired
}

export default function ExpenseProvider({ children }){
    const [expense,setExpense] = useState({});
    return <expenseContext.Provider value={ { expense,setExpense } }> { children } </expenseContext.Provider>;
}