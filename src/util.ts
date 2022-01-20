import moment, { Moment } from "moment";
import { SOQL_QUERY } from "./constants";

export const getSOQLQuery = (start : Moment, end : Moment) => {
    let q = SOQL_QUERY;
    if (q!.toLowerCase().indexOf(" where ") > 0) {
        q = `${q} AND (LastModifiedDate >= ${start.toISOString()} AND LastModifiedDate < ${end.toISOString()})`;
    } else {
        q = `${q} WHERE LastModifiedDate >= ${start.toISOString()} AND LastModifiedDate < ${end.toISOString()}`;
    }
    return q;
}
