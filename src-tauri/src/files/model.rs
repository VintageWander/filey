use std::str::FromStr;

use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqliteTypeInfo, Database, Decode, Encode, Sqlite, Type};
use strum::{Display, EnumString};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Encode, Display, EnumString)]
#[serde(rename_all = "lowercase")]
#[strum(serialize_all = "lowercase")]
pub enum Visibility {
    Public,
    Private,
}

impl Type<Sqlite> for Visibility {
    fn type_info() -> SqliteTypeInfo {
        <&str as Type<Sqlite>>::type_info()
    }
    fn compatible(ty: &SqliteTypeInfo) -> bool {
        <&str as Type<Sqlite>>::compatible(ty)
    }
}

impl<'r, DB: Database> Decode<'r, DB> for Visibility
where
    &'r str: Decode<'r, DB>,
{
    fn decode(
        value: <DB as sqlx::Database>::ValueRef<'r>,
    ) -> Result<Self, sqlx::error::BoxDynError> {
        let value = <&str as Decode<DB>>::decode(value)?;
        Ok(Visibility::from_str(value).unwrap())
    }
}

impl From<String> for Visibility {
    fn from(status: String) -> Self {
        Visibility::from_str(&status).unwrap()
    }
}

#[derive(Debug, Type, Serialize, Deserialize)]
pub struct File {
    pub id: Uuid,
    pub name: String,
    pub visibility: Visibility,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileResponse {
    pub id: Uuid,
    pub mime: String,
    pub name: String,
}
