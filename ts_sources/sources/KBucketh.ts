import { deserialize, serialize } from './Utility';

/**
 * Interface used to store in which bucket every ID is stored.
 * Shared between all buckets.
 */
export interface IPeerIdRegistry {
    [key: string]: number;
}

/**
 * Configuration interface for the {@link KBucketh} creator.
 */
export interface ICreateConfig {
    bit_distance?: number;
    bucket_size?: number;
}

/**
 * Create the first KBucketh of the list. Use this function instead of the
 * constructor.
 *
 * @param {any} peer_id ID of the local Peer.
 * @param {ICreateConfig} config Configuration for the KBucketh.
 */
export function create(peer_id: any, config?: ICreateConfig): KBucketh {
    const shared_peer_registry = {} as IPeerIdRegistry;
    return (new KBucketh(
        peer_id,
        config ? (config.bit_distance || 0) : 0,
        shared_peer_registry,
        config ? (config.bucket_size || 20) : 20)
    );
}

/**
 * Main class. Self expanding double linked list. All nodes are aware of PeerID positions.
 */
export class KBucketh {

    private readonly _peer_id: Uint8Array;
    private readonly _deserialized_peer_id: string;
    private readonly _bit_distance: number;
    private readonly _peer_id_registry: IPeerIdRegistry;
    private readonly _bucket_size: number;

    //private _left_bucket: KBucketh = null;
    //private _right_bucket: KBucketh = null;

    /**
     * @param {any} peer_id ID of the local Peer.
     * @param {number} bit_distance Bit distance of the current KBucketh.
     * @param {IPeerIdRegistry} peer_id_registry Shared Peer Registry
     * @param {number} bucket_size Size of the bucket.
     */
    public constructor(peer_id: any, bit_distance: number, peer_id_registry: IPeerIdRegistry, bucket_size: number) {
        this._peer_id = serialize(peer_id);
        this._deserialized_peer_id = deserialize(this._peer_id);
        this._bit_distance = bit_distance;
        this._peer_id_registry = peer_id_registry;
        this._bucket_size = bucket_size;
    }

    /**
     * Return the ID of the Peer in its serialized form.
     */
    public get PeerID(): Uint8Array {
        return this._peer_id;
    }

    /**
     * Return the ID of the Peer in its deserialized form.
     */
    public get DeserializedPeerID(): string {
        return this._deserialized_peer_id;
    }

    /**
     * Return the ID of the KBucketh.
     */
    public get BucketID(): number {
        return this._bit_distance;
    }

    /**
     * Return the total size of the bucket.
     */
    public get limit(): number {
        return this._bucket_size;
    }

    /**
     * Return the current stored Peer count in this KBucketh.
     */
    public get size(): number {
        return this._bucket_size;
    }

    /**
     * Search in the registry the Bucket ID where the Peer ID is stored.
     *
     * @param {any} peer_id ID of the searched Peer.
     */
    public bucketIDOf(peer_id: any): number {
        const deserialized = deserialize(serialize(peer_id));
        return (this._peer_id_registry[deserialized] || -1);
    }

}
